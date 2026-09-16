#!/usr/bin/env python3
"""Offline behavior checks; generated PDFs live only in a temporary directory."""
import datetime as dt
import tempfile
import unittest
from pathlib import Path
from pypdf import PdfReader
import reports

class ReportsTest(unittest.TestCase):
    def fixture(self,name):return reports.load(reports.SKILL/'assets/fixtures'/f'{name}.json')
    def test_year_and_leap_boundaries(self):
        self.assertEqual(reports.windows('2027-01-09')['previous_month'],{'start':'2026-12-01','end':'2026-12-31'})
        self.assertEqual(reports.windows('2028-03-01')['previous_month']['end'],'2028-02-29')
        self.assertEqual(reports.windows('2027-03-01')['previous_month']['end'],'2027-02-28')
    def test_all_formats_and_page_counts(self):
        with tempfile.TemporaryDirectory() as tmp:
            for prop,n in [('website',6),('google',4),('facebook',7)]:
                result=reports.render(self.fixture(prop),Path(tmp)/f'{prop}.pdf',True)
                r=PdfReader(result['output']);self.assertEqual(len(r.pages),n)
                for i,p in enumerate(r.pages,1):
                    self.assertEqual((float(p.mediabox.width),float(p.mediabox.height)),(612,792))
                    self.assertIn(f'{i} / {n}',p.extract_text())
    def test_fixture_cannot_be_issued_accidentally(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(ValueError,'Historical fixture'):reports.render(self.fixture('google'),Path(tmp)/'report.pdf')
            self.assertFalse((Path(tmp)/'report.pdf').exists())
    def test_rejects_partial_previous_month_and_wrong_fallback(self):
        d=self.fixture('google');d['period']['end']='2026-08-30'
        with self.assertRaisesRegex(ValueError,'full preceding'):reports.validate(d)
        d=self.fixture('website');d['period']['fallback_reason']=''
        with self.assertRaisesRegex(ValueError,'fallback needs'):reports.validate(d)
        d=self.fixture('website');d['period']['end']='2026-09-08'
        with self.assertRaisesRegex(ValueError,'through the as-of'):reports.validate(d)
    def test_missing_dates_and_stale_chart(self):
        d=self.fixture('facebook');d['sections']['daily']['rows'].pop()
        with self.assertRaisesRegex(ValueError,'every reporting date'):reports.validate(d)
        d=self.fixture('facebook');d['sections']['daily_chart']['series'][0]['values'][0]+=1
        with self.assertRaisesRegex(ValueError,'differ'):reports.validate(d)
    def test_reconciliation_and_explanation(self):
        d=self.fixture('google');d['metrics']['profile_views']+=1
        with self.assertRaisesRegex(ValueError,'discovery.profile_views'):reports.validate(d)
        d['reconciliation_exceptions']={'discovery.profile_views':'The provider total changed during capture; retain the later reported total.'}
        _,notes=reports.validate(d);self.assertTrue(any('2,494' in n for n in notes))
    def test_null_is_not_zero(self):
        d=self.fixture('google');d['metrics']['calls']=None
        with self.assertRaisesRegex(ValueError,'Explain missing'):reports.validate(d)
        d['unavailable_metrics']['calls']='Call counts were not supplied.'
        d['sections']['actions']['rows'][2][1]=None
        _,notes=reports.validate(d);self.assertTrue(any('unavailable' in n for n in notes))
    def test_negative_net_follows_supported(self):
        d=self.fixture('facebook');d['metrics']['unfollows']=20;d['metrics']['net_follows']=-6
        reports.validate(d)
    def test_full_february_and_zero_chart(self):
        d=self.fixture('google');d['as_of']='2028-03-09';d['period'].update(start='2028-02-01',end='2028-02-29',displayed_range='February 1-29, 2028')
        for source in d['sources']:source['captured']='2028-03-09'
        for key in d['metrics']:d['metrics'][key]=0
        d['sections']['daily']['rows']=[[(dt.date(2028,2,1)+dt.timedelta(days=i)).isoformat(),0,0,0,0,0] for i in range(29)]
        d['sections']['discovery']['rows']=[['Test category',0,'Not applicable']]
        for row in d['sections']['actions']['rows']:row[1]=0
        d['sections']['monthly_chart']={'labels':['Feb'],'series':[{'label':'Actions','values':[0]}],'note':'Synthetic empty-activity test.'}
        with tempfile.TemporaryDirectory() as tmp:
            result=reports.render(d,Path(tmp)/'leap.pdf',True);text='\n'.join(p.extract_text() for p in PdfReader(result['output']).pages)
            self.assertIn('February 1-29, 2028',text);self.assertIn('Feb 29',text)
    def test_overflow_preserves_all_rows(self):
        d=self.fixture('website');d['sections']['referrers']['rows']=[[f'outside-source-{i:03}',0,0] for i in range(120)]
        with tempfile.TemporaryDirectory() as tmp:
            result=reports.render(d,Path(tmp)/'long.pdf',True);r=PdfReader(result['output']);text='\n'.join(p.extract_text() for p in r.pages)
            self.assertGreater(len(r.pages),6)
            for i in range(120):self.assertIn(f'outside-source-{i:03}',text)
            for i,p in enumerate(r.pages,1):self.assertIn(f'{i} / {len(r.pages)}',p.extract_text())

    def test_leap_day_in_both_daily_charts(self):
        for prop in ('website','facebook'):
            d=self.fixture(prop);t=reports.load(reports.SKILL/'assets'/f'{prop}.json')
            d['as_of']='2028-03-09';d['period'].update(kind='previous_month',start='2028-02-01',end='2028-02-29',displayed_range='February 1-29, 2028',partial_note='',fallback_reason='')
            for key in d['metrics']:d['metrics'][key]=0
            for section,col,metric in t['checks']:
                d['sections'][section]={'rows':[],'note':'Synthetic unavailable detail.'}
            cols=next(len(b['columns']) for pg in t['pages'] for b in pg['blocks'] if b.get('id')=='daily')
            days=[dt.date(2028,2,1)+dt.timedelta(days=i) for i in range(29)]
            d['sections']['daily']={'rows':[[day.isoformat()]+[0]*(cols-1) for day in days],'note':''}
            d['sections']['daily_chart']={'labels':[f'{day:%b} {day.day}' for day in days],'series':[{'label':f'Series {i+1}','values':[0]*29} for i in range(len(t['daily_chart_columns']))],'note':''}
            reports.validate(d)
            with tempfile.TemporaryDirectory() as tmp:
                result=reports.render(d,Path(tmp)/'leap.pdf',True)
                text='\n'.join(p.extract_text() for p in PdfReader(result['output']).pages)
                self.assertIn('Feb 29',text)
    def test_printed_google_actions_match_metrics(self):
        d=self.fixture('google');d['sections']['actions']['rows'][0][1]=999
        with self.assertRaisesRegex(ValueError,'Printed Google action'):reports.validate(d)
    def test_invalid_percentages_and_boolean(self):
        for prop,key in [('website','bounce_rate'),('google','phone_share')]:
            d=self.fixture(prop);d['metrics'][key]=150
            with self.assertRaisesRegex(ValueError,'Percentage'):reports.validate(d)
        d=self.fixture('facebook');d['metrics']['net_follows']=True
        with self.assertRaisesRegex(ValueError,'Invalid numeric'):reports.validate(d)
    def test_invalid_detail_and_total_cells(self):
        for value in (float('nan'),float('inf'),-2,True):
            d=self.fixture('google');d['sections']['daily']['total_row']=['MONTH',value,71,125,0,236]
            with self.assertRaisesRegex(ValueError,'Invalid cell'):reports.validate(d)
        d=self.fixture('website');d['sections']['pages']['rows'][0][2]=None;d['sections']['pages']['rows'][1][2]=-3
        with self.assertRaisesRegex(ValueError,'Invalid cell'):reports.validate(d)
    def test_totals_survive_missing_daily_detail(self):
        d=self.fixture('google');d['sections']['daily']={'rows':[],'note':'Daily detail is unavailable.','total_row':['VERIFIED MONTH TOTAL',40,71,125,0,236]}
        with tempfile.TemporaryDirectory() as tmp:
            result=reports.render(d,Path(tmp)/'missing.pdf',True)
            text='\n'.join(p.extract_text() for p in PdfReader(result['output']).pages)
            self.assertIn('VERIFIED MONTH TOTAL',' '.join(text.split()))
    def test_oversize_post_cell_continues(self):
        d=self.fixture('facebook');d['sections']['posts']['rows'][0][0]='\n'.join(f'Unique post line {i:03}' for i in range(70))
        with tempfile.TemporaryDirectory() as tmp:
            result=reports.render(d,Path(tmp)/'tall.pdf',True)
            r=PdfReader(result['output']);text='\n'.join(p.extract_text() for p in r.pages)
            self.assertGreater(len(r.pages),7)
            for i in range(70):self.assertIn(f'Unique post line {i:03}',text)

if __name__=='__main__':unittest.main()
