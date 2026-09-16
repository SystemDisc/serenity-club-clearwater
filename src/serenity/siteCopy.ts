/** Existing public wording, retained as the migration defaults. */
export const siteCopyDefaults = {
  aboutHistory:
    'Serenity Club opened more than 50 years ago as a safe, sober place to go. The club was incorporated in 1993 to provide assistance, encouragement, and reassurance to people seeking recovery.',
  aboutWelcome:
    'The clubhouse serves people irrespective of race, color, creed, or gender, and supports the moral, mental, social, and physical betterment of its members.',
  aboutStewardship:
    'The board and club manager steward the space, policies, events, and membership program so the clubhouse can continue serving Clearwater.',
  groupIntroduction:
    'Serenity Club hosts recovery meetings and club service work in a practical, central clubhouse space.',
  facilityInformation:
    'Groups can reach out about meeting room use, schedule questions, special events, and service opportunities.',
  smallRoomInformation:
    'Members may request one of the small rooms for sponsor and sponsee meetings. Include your first and last name, email, phone number, requested date and time, and message.',
  sponsorshipInformation:
    'Club sponsors support events, supplies, and clubhouse needs. The sponsor level listed by the club starts at a $500 annual donation.',
  sponsorshipContact:
    'Contact the club manager with your name, email, phone number, and sponsorship message.',
  donatedItemsInformation: 'Drop off new and gently used donations during weekday business hours.',
  officeVolunteerInformation: 'Contact the coffee bar manager about office volunteer needs.',
  coffeeVolunteerInformation:
    'Monthly coffee bar volunteer schedules are coordinated through the club manager.',
}
export type SiteCopy = typeof siteCopyDefaults
export const mapLinks = (address: string, cityStateZip: string) => {
  const query = encodeURIComponent(`${address}, ${cityStateZip}`)
  return {
    place: `https://www.google.com/maps/search/?api=1&query=${query}`,
    embed: `https://maps.google.com/maps?q=${query}&output=embed`,
  }
}
