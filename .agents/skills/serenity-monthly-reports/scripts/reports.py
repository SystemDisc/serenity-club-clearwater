#!/usr/bin/env python3
"""Stable layout renderer for the Serenity Club's three board reports.

No network access: an agent collects evidence and supplies current JSON data.
"""
import argparse
import datetime as dt
import io
import json
import math
import re
from pathlib import Path
from xml.sax.saxutils import escape
from zoneinfo import ZoneInfo

SKILL = Path(__file__).resolve().parents[1]
PROPERTIES = ('website', 'google', 'facebook')

def load(path):
    return json.loads(Path(path).read_text())

def date(value):
    return dt.date.fromisoformat(value)

def windows(as_of):
    today = date(as_of)
    end = today.replace(day=1) - dt.timedelta(days=1)
    return {'as_of': as_of, 'previous_month': {'start': end.replace(day=1).isoformat(), 'end': end.isoformat()},
            'rolling_30_days': {'start': (today-dt.timedelta(days=29)).isoformat(), 'end': as_of},
            'note': 'Use provider timestamps when its rolling window includes parts of 31 dates.'}

def period_label(period):
    start, end = date(period['start']), date(period['end'])
    if start.year == end.year and start.month == end.month:
        return f'{start:%B} {start.day}-{end.day}, {end.year}'
    return f'{start:%B} {start.day}, {start.year} - {end:%B} {end.day}, {end.year}'

def numeric(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) and v >= 0

def readable_key(key):
    labels={'content_types':'activity by content format','daily':'daily figures',
            'discovery':'where people saw the listing','pages':'website pages',
            'bounce_rate':'one-page visits','phone_share':'share of views on phones',
            'all_actions':'actions taken','public_interactions':'reactions, comments, and shares',
            'net_follows':'net change in followers','visits':'Page visits'}
    return ' — '.join(labels.get(part,part.replace('_',' ')) for part in key.split('.')).capitalize()

def fmt(v):
    if v is None: return 'Not available'
    if isinstance(v,str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}',v):
        return f'{date(v):%b} {date(v).day}'
    if isinstance(v, (float, int)) and not isinstance(v, bool):
        return f'{v:,.0f}' if float(v).is_integer() else f'{v:,g}'
    return str(v)

def validate(d):
    if d.get('property') not in PROPERTIES: raise ValueError('Unknown property')
    t = load(SKILL/'assets'/f'{d["property"]}.json')
    if any(sum(b['widths']) != (252 if b.get('split_columns')==2 else 524) for pg in t['pages'] for b in pg['blocks'] if b['type']=='table'): raise ValueError('Template columns do not fit the print frame')
    if d.get('layout_version') != t['version']: raise ValueError('Wrong layout_version')
    as_of = date(d['as_of']); p=d['period']; start=date(p['start']); end=date(p['end'])
    if end < start or end > as_of: raise ValueError('Invalid or future date range')
    if not p.get('timezone') or not p.get('displayed_range'): raise ValueError('Record the provider timezone and displayed range')
    if p['kind']=='previous_month':
        expected=windows(d['as_of'])['previous_month']
        if (p['start'],p['end']) != (expected['start'],expected['end']): raise ValueError('Previous month must be the full preceding calendar month')
    elif p['kind']=='rolling_30_days':
        if end!=as_of or (end-start).days not in (29,30): raise ValueError('Fallback must be 30 days through the as-of date')
        if not p.get('fallback_reason'): raise ValueError('A fallback needs observed evidence that previous month is unavailable')
        if (end-start).days==30 and not p.get('partial_note'): raise ValueError('31 date labels require a partial-boundary explanation')
    else: raise ValueError('Unknown period kind')
    if not d.get('identity_verified'): raise ValueError('Confirm the club account identity first')
    if not d.get('sources'): raise ValueError('At least one captured source required')
    for s in d['sources']:
        if not s.get('label') or not s.get('url','').startswith('https://') or date(s['captured'])>as_of:
            raise ValueError('Source requires label, HTTPS URL, and capture date')
    if set(d.get('metrics',{})) != set(t['metrics']): raise ValueError('Metric keys must match the template')
    for key,v in d['metrics'].items():
        if v is not None and not (numeric(v) or key=='net_follows' and not isinstance(v,bool) and isinstance(v,(int,float)) and math.isfinite(v)):
            raise ValueError(f'Invalid numeric metric {key}')
        if key in ('bounce_rate','phone_share') and v is not None and v>100: raise ValueError(f'Percentage outside 0-100: {key}')
        if v is None and not d.get('unavailable_metrics',{}).get(key): raise ValueError(f'Explain missing metric {key}')
    expected={b['id']:b for pg in t['pages'] for b in pg['blocks'] if 'id' in b}
    if set(d.get('sections',{})) != set(expected): raise ValueError('Section IDs must exactly match the template')
    for key,b in expected.items():
        v=d['sections'][key]
        if b['type']=='text':
            if not isinstance(v,str) or not v.strip(): raise ValueError(f'Provide narrative or missing-data note for {key}')
        elif b['type']=='table':
            if not isinstance(v,dict) or not isinstance(v.get('rows'),list): raise ValueError(f'{key} needs rows')
            if not v['rows'] and not v.get('note'): raise ValueError(f'Explain missing table {key}')
            for row in v['rows']+([v['total_row']] if v.get('total_row') is not None else []):
                if len(row)!=len(b['columns']): raise ValueError(f'Wrong column count in {key}')
                if any(isinstance(x,(list,dict,bool)) or isinstance(x,(int,float)) and (not math.isfinite(x) or x<0 and i not in b.get('signed_columns',[])) for i,x in enumerate(row)): raise ValueError(f'Invalid cell in {key}')
            if v.get('total_row') is not None and len(v['total_row'])!=len(b['columns']): raise ValueError(f'Wrong total row in {key}')
        elif b['type']=='chart':
            if not isinstance(v,dict) or not isinstance(v.get('labels'),list) or not isinstance(v.get('series'),list): raise ValueError(f'{key} needs labels and series')
            if not v['labels'] and not v.get('note'): raise ValueError(f'Explain unavailable chart {key}')
            for series in v['series']:
                if len(series['values'])!=len(v['labels']) or any(x is not None and not numeric(x) for x in series['values']): raise ValueError(f'Invalid chart {key}')
    # Every date is kept, including genuine zeroes; missing values are null.
    daily=d['sections']['daily']['rows']
    if daily:
        days=[(start+dt.timedelta(days=i)).isoformat() for i in range((end-start).days+1)]
        if [r[0] for r in daily]!=days: raise ValueError('Daily rows must cover every reporting date exactly once, in order')
        for row in daily:
            if any(x is not None and not numeric(x) for x in row[1:]): raise ValueError('Daily cells must be nonnegative numbers or null')
    if 'daily_chart_columns' in t:
        chart=d['sections']['daily_chart'];expected_columns=t['daily_chart_columns']
        if chart['labels']:
            if not daily or len(chart['series'])!=len(expected_columns): raise ValueError('Daily chart must match the daily table')
            for series,col in zip(chart['series'],expected_columns):
                if series['values']!=[r[col] for r in daily]: raise ValueError('Daily chart values differ from the daily table')
            for label,row in zip(chart['labels'],daily):
                day=date(row[0])
                try: parsed=dt.datetime.strptime(f'{label} {day.year}','%b %d %Y')
                except ValueError: raise ValueError('Daily chart labels must use Mon D, such as Aug 1')
                day=date(row[0])
                if (parsed.month,parsed.day)!=(day.month,day.day):raise ValueError('Daily chart date labels differ from the daily table')
    notes=[]
    def reconcile(key,values,total):
        if any(x is not None and not numeric(x) for x in values): raise ValueError(f'Non-numeric reconciliation: {key}')
        if not values or total is None or any(x is None for x in values):
            notes.append(f'{readable_key(key)}: some figures are unavailable, so the detailed counts cannot be checked against the reported total.')
            return
        if any(not numeric(x) for x in values): raise ValueError(f'Non-numeric reconciliation: {key}')
        actual=sum(values)
        if not math.isclose(actual,total,abs_tol=0.01):
            explanation=d.get('reconciliation_exceptions',{}).get(key)
            if not explanation: raise ValueError(f'{key}: rows add to {actual}, provider total is {total}; investigate or explain the observed discrepancy')
            notes.append(f'{readable_key(key)}: detailed counts add to {fmt(actual)}; the service reports {fmt(total)}. {explanation}')
    for section,col,metric in t['checks']:
        reconcile(f'{section}.{metric}',[r[col] for r in d['sections'][section]['rows']],d['metrics'][metric])
    m=d['metrics']
    if d['property']=='google':
        actions=d['sections']['actions']['rows']
        if actions:
            action_metrics=('website_clicks','directions','calls','bookings')
            if len(actions)!=4:raise ValueError('Google action table needs website clicks, directions, calls, bookings in that order')
            for row,key in zip(actions,action_metrics):
                if row[1]!=m[key]:raise ValueError(f'Printed Google action differs from metric: {key}')
        reconcile('all_actions',[m[x] for x in ('calls','directions','website_clicks','bookings')],m['actions'])
        for r in daily:
            if all(x is not None for x in r[1:]) and sum(r[1:5])!=r[5]: raise ValueError(f'Google daily actions do not reconcile: {r[0]}')
    if d['property']=='facebook':
        if all(m[x] is not None for x in ('new_follows','unfollows','net_follows')) and m['new_follows']-m['unfollows']!=m['net_follows']:
            raise ValueError('New follows minus unfollows must equal net follows')
        reconcile('public_interactions',[m[x] for x in ('reactions','comments','shares')],m['interactions'])
    return t,notes

def render(d,out,allow_fixture=False):
    t,checks=validate(d)
    if d.get('fixture') and not allow_fixture: raise ValueError('Historical fixture: use only for QA with --allow-fixture; collect fresh data for a real report')
    from reportlab.pdfgen import canvas
    from reportlab.platypus import BaseDocTemplate,PageTemplate,Frame,Paragraph,Table,TableStyle,Spacer,PageBreak,Flowable,KeepTogether
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.colors import HexColor,white
    from reportlab.pdfbase.pdfmetrics import stringWidth
    ink=HexColor('#193C37');teal=HexColor('#147D73');blue=HexColor('#326CA6');gold=HexColor('#AB762F');muted=HexColor('#526560');line=HexColor('#CCD9D5')
    styles={name:ParagraphStyle(name,fontName=font,fontSize=size,leading=leading,textColor=color,spaceAfter=after) for name,font,size,leading,color,after in [
        ('body','Helvetica',10.2,14,ink,10),('note','Helvetica',9.3,12.5,muted,9),('section','Helvetica-Bold',14,18,ink,10),('cell','Helvetica',9.4,12,ink,0),('head','Helvetica-Bold',9.3,12,teal,0)]}
    def markup(s):
        # Keep the voice editable while typography and markup capabilities stay fixed.
        s=escape(str(s))
        for tag in ('b','i'): s=s.replace(f'&lt;{tag}&gt;',f'<{tag}>').replace(f'&lt;/{tag}&gt;',f'</{tag}>')
        return s.replace('&lt;br/&gt;','<br/>').replace('\n','<br/>')
    def para(s,style='body'):return Paragraph(markup(s),styles[style])
    def expand(s):return s.replace('{period}',period_label(d['period'])).replace('{prepared}',f'{date(d["as_of"]):%B} {date(d["as_of"]).day}, {date(d["as_of"]).year}')
    class Cards(Flowable):
        width=524;height=128
        def __init__(self,items):Flowable.__init__(self);self.width=524;self.height=128;self.items=items
        def draw(self):
            for i,item in enumerate(self.items):
                x=i*180;v=d['metrics'][item['metric']];s=fmt(v)+('%' if item.get('percent') and v is not None else '')
                self.canv.setStrokeColor(line);self.canv.setLineWidth(.7);self.canv.roundRect(x,0,164,128,5,fill=0)
                size=31
                while stringWidth(s,'Helvetica-Bold',size)>140 and size>17:size-=1
                if stringWidth(s,'Helvetica-Bold',size)>140:raise ValueError('Summary metric does not fit its card')
                self.canv.setFillColor(teal if i<2 else blue);self.canv.setFont('Helvetica-Bold',size);self.canv.drawString(x+12,90,s)
                for txt,y,font in [(item['label'],69,True),(item['description'],55,False)]:
                    st=ParagraphStyle('card',fontName='Helvetica-Bold' if font else 'Helvetica',fontSize=10.5 if font else 9.5,leading=13,textColor=ink)
                    pp=Paragraph(markup(txt),st);_,hh=pp.wrap(140,100)
                    if hh>y-8:raise ValueError('Card description overflow')
                    pp.drawOn(self.canv,x+12,y-hh)
    class Chart(Flowable):
        width=524
        def __init__(self,v,height):Flowable.__init__(self);self.width=524;self.v=v;self.height=height
        def draw(self):
            cv=self.canv;v=self.v;labels=v['labels'];series=v['series']
            if not labels:return
            vals=[x for s in series for x in s['values'] if x is not None]
            maximum=max(vals or [0]);raw=max(1,maximum)/4;scale=10**math.floor(math.log10(raw));step=next(z*scale for z in (1,2,5,10) if z*scale>=raw);top=step*4
            x0,y0,cw,ch=39,29,465,self.height-60
            for j in range(5):
                y=y0+j*ch/4;cv.setStrokeColor(line);cv.setLineWidth(.5);cv.line(x0,y,x0+cw,y)
                cv.setFillColor(muted);cv.setFont('Helvetica',8);cv.drawRightString(x0-7,y-3,fmt(j*step))
            for si,s in enumerate(series):
                color=(teal,blue,gold)[si%3];cv.setStrokeColor(color);cv.setFillColor(color);cv.setLineWidth(1.6);path=None
                for i,n in enumerate(s['values']):
                    if n is None:
                        if path:cv.drawPath(path);path=None
                        continue
                    x=x0+i*cw/max(1,len(labels)-1);y=y0+n/top*ch
                    if path is None:path=cv.beginPath();path.moveTo(x,y)
                    else:path.lineTo(x,y)
                    cv.circle(x,y,1.4,fill=1,stroke=0)
                if path:cv.drawPath(path)
                cv.setFont('Helvetica',9);cv.drawString(x0+si*155,self.height-12,s['label'])
            indexes=sorted({round(i*(len(labels)-1)/min(6,len(labels)-1)) for i in range(min(6,len(labels)-1)+1)}) if len(labels)>1 else [0]
            for i in indexes:
                label=str(labels[i]);cv.setFillColor(muted);cv.setFont('Helvetica',8)
                if len(label)>12:raise ValueError('Chart labels must be at most 12 characters')
                cv.drawCentredString(x0+i*cw/max(1,len(labels)-1),14,label)
    class NumberedCanvas(canvas.Canvas):
        def __init__(self,*args,**kwargs):super().__init__(*args,**kwargs);self.saved=[]
        def showPage(self):self.saved.append(dict(self.__dict__));self._startPage()
        def save(self):
            count=len(self.saved)
            for state in self.saved:
                self.__dict__.update(state);self.setFillColor(muted);self.setFont('Helvetica',8);self.drawRightString(568,27,f'{self._pageNumber} / {count}')
                super().showPage()
            super().save()
    def decorate(c,doc):
        pg=doc.pageTemplate.report_page;c.saveState();c.setFillColor(white);c.rect(0,0,612,792,fill=1,stroke=0)
        c.setStrokeColor(teal);c.setLineWidth(2);c.line(44,772,568,772)
        c.setFillColor(teal);c.setFont('Helvetica-Bold',9.5);c.drawString(44,751,'SERENITY CLUB OF CLEARWATER')
        c.setFillColor(muted);c.setFont('Helvetica',8);c.drawRightString(568,751,'BOARD & MEMBER REPORT')
        title=pg['title'];c.setFillColor(ink);c.setFont('Helvetica-Bold',27)
        if stringWidth(title,'Helvetica-Bold',27)>524:raise ValueError('Template title overflow')
        c.drawString(44,713,title)
        st=ParagraphStyle('sub',fontName='Helvetica',fontSize=10.5,leading=14,textColor=muted)
        p=Paragraph(markup(expand(pg['subtitle'])),st);_,h=p.wrap(524,50);p.drawOn(c,44,694-h)
        c.setStrokeColor(line);c.setLineWidth(.6);c.line(44,663,568,663);c.line(44,43,568,43)
        c.setFillColor(muted);c.setFont('Helvetica',7.8);c.drawString(44,27,t['footer']+' | '+period_label(d['period']).upper())
        if d.get('fixture'):c.setFillColor(gold);c.setFont('Helvetica',8);c.drawRightString(568,650,'HISTORICAL QA FIXTURE')
        c.restoreState()
    out=Path(out);out.parent.mkdir(parents=True,exist_ok=True);buffer=io.BytesIO()
    doc=BaseDocTemplate(buffer,pagesize=(612,792),leftMargin=44,rightMargin=44,topMargin=150,bottomMargin=60,title=f'Serenity Club of Clearwater | {t["label"]} | {period_label(d["period"])}',author='Serenity Club of Clearwater')
    for i,pg in enumerate(t['pages']):
        pt=PageTemplate(id=f'p{i}',frames=[Frame(44,60,524,581,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=decorate);pt.report_page=pg;doc.addPageTemplates(pt)
    from reportlab.platypus import NextPageTemplate
    story=[]
    for i,pg in enumerate(t['pages']):
        if i:story.extend([NextPageTemplate(f'p{i}'),PageBreak()])
        for b in pg['blocks']:
            kind=b['type']
            if kind=='heading':story.extend([Spacer(1,6),para(expand(b['text']),'section')]);story[-1].keepWithNext=True
            elif kind=='fixed':story.append(para(expand(b['text']),b.get('style','note')))
            elif kind=='cards':story.extend([Cards(b['items']),Spacer(1,16)])
            elif kind=='text':story.append(para(d['sections'][b['id']],b.get('style','body')))
            elif kind=='table':
                v=d['sections'][b['id']];rows=v['rows'];data=[[para(h,'head') for h in b['columns']]]
                for row in rows+([v['total_row']] if v.get('total_row') is not None else []):
                    cells=[]
                    for x in row:
                        st=ParagraphStyle('aligned-cell',parent=styles['cell'],alignment=2 if isinstance(x,(int,float)) else 0)
                        cells.append(Paragraph(markup(fmt(x)),st))
                    data.append(cells)
                if rows or v.get('total_row') is not None:
                    def make_table(values):
                        tb=Table(values,colWidths=b['widths'],repeatRows=1,hAlign='LEFT',splitInRow=1)
                        tb.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),b.get('padding',3)),('BOTTOMPADDING',(0,0),(-1,-1),b.get('padding',3)),('LINEBELOW',(0,0),(-1,0),.7,teal),('LINEBELOW',(0,1),(-1,-1),.45,line)]))
                        return tb
                    if b.get('split_columns')==2:
                        cut=math.ceil((len(data)-1)/2)
                        left=make_table(data[:cut+1]);right=make_table([data[0]]+data[cut+1:])
                        tb=Table([[left,'',right]],colWidths=[252,20,252],hAlign='LEFT')
                        tb.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]))
                    else:tb=make_table(data)
                    story.extend([tb,Spacer(1,10)])
                if v.get('note'):story.append(para(v['note'],'note'))
            elif kind=='chart':
                v=d['sections'][b['id']]
                if v['labels']:story.append(Chart(v,b.get('height',160)))
                if v.get('note'):story.append(para(v['note'],'note'))
            elif kind=='sources':
                p=d['period'];notes=[f'Reporting period: {p["displayed_range"]}. Reporting timezone: {p["timezone"]}.']
                for key in ('fallback_reason','partial_note'):
                    if p.get(key):notes.append(p[key])
                notes+=checks+[f'{readable_key(k)}: {v}' for k,v in d.get('unavailable_metrics',{}).items()]
                for n in notes:story.append(para(n,'note'))
                for s in d['sources']:story.append(para(f'{s["label"]} | captured {s["captured"]}\n{s["url"]}','note'))
    doc.build(story,canvasmaker=NumberedCanvas)
    from pypdf import PdfReader
    pdf=buffer.getvalue();reader=PdfReader(io.BytesIO(pdf))
    if len(reader.pages)<len(t['pages']):raise ValueError('Missing report sections')
    out.write_bytes(pdf)
    return {'output':str(out.resolve()),'pages':len(reader.pages),'layout_version':t['version'],'checks':checks}

def main():
    parser=argparse.ArgumentParser(description=__doc__);sub=parser.add_subparsers(dest='command',required=True)
    p=sub.add_parser('dates');p.add_argument('--as-of',default=dt.datetime.now(ZoneInfo('America/New_York')).date().isoformat())
    p=sub.add_parser('init');p.add_argument('--property',choices=PROPERTIES,required=True);p.add_argument('--as-of',required=True);p.add_argument('--output',required=True)
    p=sub.add_parser('validate');p.add_argument('input')
    p=sub.add_parser('render');p.add_argument('input');p.add_argument('--output',required=True);p.add_argument('--allow-fixture',action='store_true')
    args=parser.parse_args()
    if args.command=='dates':result=windows(args.as_of)
    elif args.command=='init':
        t=load(SKILL/'assets'/f'{args.property}.json');p=windows(args.as_of)['previous_month']
        result={'layout_version':t['version'],'property':args.property,'as_of':args.as_of,'identity_verified':False,'period':{'kind':'previous_month',**p,'timezone':'','displayed_range':'','fallback_reason':'','partial_note':''},'metrics':{k:None for k in t['metrics']},'unavailable_metrics':{},'sections':{},'sources':[],'reconciliation_exceptions':{}}
        for pg in t['pages']:
            for b in pg['blocks']:
                if 'id' in b:result['sections'][b['id']]='' if b['type']=='text' else {'rows':[],'note':''} if b['type']=='table' else {'labels':[],'series':[],'note':''}
        dest=Path(args.output)
        if dest.exists():raise ValueError('Refusing to overwrite an existing input')
        dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(result,indent=2)+'\n');result={'input':str(dest.resolve())}
    elif args.command=='validate':t,notes=validate(load(args.input));result={'valid':True,'checks':notes}
    else:result=render(load(args.input),args.output,args.allow_fixture)
    print(json.dumps(result,indent=2))
if __name__=='__main__':
    try:main()
    except (ValueError,KeyError,TypeError) as exc:raise SystemExit(f'Report input error: {exc}')
