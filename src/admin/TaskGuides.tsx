import { CalendarDays, CalendarCheck, Images, BadgeDollarSign, NotebookPen } from 'lucide-react'
const guides = [
  {
    title: 'Replace the monthly flyer',
    Icon: CalendarDays,
    steps: [
      'From Home, choose Update this month’s flyer. Check the month and the currently published picture.',
      'Choose a new image, or use Choose Word document for a one-page .docx up to 4 MB. The Word original is retained separately.',
      'Enlarge the selected image and read it carefully. Enter the dates and details in Flyer details in text.',
      'Save Draft if unfinished. When ready, choose Publish changes, then View published page to check Events. Previous versions retains the earlier flyer.',
    ],
  },
  {
    title: 'Correct a meeting',
    Icon: CalendarCheck,
    steps: [
      'From Home, choose Change a meeting. Find its group name or day in the weekly agenda.',
      'Check days, time, room and format with the group. Use Separate this day when one day differs from the others.',
      'Use the date preview and next meeting dates to check the result. For a one-off change, use a date exception instead of changing the whole schedule.',
      'Record when and with whom the schedule was checked. Keep unknown formats unconfirmed. Publish, then check the public meeting schedule.',
    ],
  },
  {
    title: 'Add photos or create an album',
    Icon: Images,
    steps: [
      'Choose Add photos. Pick Main gallery, an existing album, or a new album, then enter the shared title once.',
      'Choose many photos from your device or the library. Wait for each thumbnail. A failed file can be retried without repeating successful uploads.',
      'Review the pictures, captions and descriptions. Exclude unwanted photos, arrange them with Move up/down or drag, and keep the automatic collage or choose a photo as the album cover.',
      'Publish the ready photos and open the gallery or album. To return later, use Finish adding photos on Home. After a refresh, reselect original files only for uploads that had not finished.',
    ],
  },
  {
    title: 'Update the dues reminder',
    Icon: BadgeDollarSign,
    steps: [
      'From Home, choose Update dues reminder. This changes the notice on About.',
      'Choose automatic current month, a selected month, or off. Automatic text is simplest when the wording repeats every month.',
      'Check this month, next month and phone previews. If adding month-specific artwork, make sure its month matches; expired artwork is hidden.',
      'Publish, then View published page. Use Previous versions if an earlier reminder needs to be restored.',
    ],
  },
  {
    title: 'Write News & updates',
    Icon: NotebookPen,
    steps: [
      'Open News & updates and create a post. Add a title, optional introduction and cover photo.',
      'Write or paste the article. Use headings, lists and links from the toolbar. Add a Photo block for an article picture and caption.',
      'Save the first draft. Later valid changes autosave privately. Preview the draft while signed in; it is not yet visible to visitors.',
      'Publish when ready and open its public page. Editing a published article keeps the old public version until you publish the changes.',
    ],
  },
]
export default function TaskGuides() {
  return (
    <section className="club-panel">
      <h2>Short task guides</h2>
      <p>Open a guide for the steps. Keep it open in another tab while you work.</p>
      {guides.map(({ title, Icon, steps }) => (
        <details className="club-task-guide" key={title}>
          <summary>
            <Icon size={28} aria-hidden="true" />
            {title}
          </summary>
          <ol>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      ))}
    </section>
  )
}
