<h1>
  <p align="center">
    <a href="https://studysmartesf.netlify.app/" target="_blank">
      <img src="/src/images/favicon.webp" alt="Logo" height="108">
      <br>
      StudySmart
    </a>
  </p>
</h1>
<p align="center">
    A website that lets Toddle students view their homework in a comfortable interface alongside daily emails.
</p>

---

## SDG Goals
- Our website aligns with:
  - SDG 3 - Good Health and Well-Being. Our website aims to help students stress less and study more.
  - SDG 4 - Quality Education. Our website helps you plan your studies and get on top of your grades.
- Find out more on our [website](https://example-canva-link.com/)!

## Features
- [x] Store preferences for the user's timetable URL and whether they want to receive emails or not.
- [x] Send an email at 15:30 HKT every weekday and 10:00 HKT every weekend.
- [x] Homework is displayed in an easy-to-read format so as not to stress the user.
- [ ] Add a dark mode.
- [ ] Add a smart AI chatbot for users to converse with.
- [ ] Add some mental health tips and tricks to stay on top of your grades.

## Code Credits
- Files [email.js](/src/js/email.js) and [api.js](/netlify/functions/api.js) use Netlify Blobs to store user data in the cloud.
- The file [api.js](/netlify/functions/api.js) uses Netlify Functions to access the user data and modify it from the webpage.
- Files [weekdays.js](/netlify/functions/weekdays.js) and [weekends.js](/netlify/functions/weekends.js) use Netlify Scheduled Functions to email all the users once every day.
- The file [timetable.js](/src/js/timetable.js) uses node-ical to parse the timetables found.
- The file [email.js](/src/js/email.js) uses pLimit to throttle the network requests to speed up the code.

## Emails
- The emails are sent on these days:
  - Weekdays - 15:30 HKT
  - Weekends - 10:00 HKT
- The Brevo API provides a maximum of 300 emails per day, leading to a maximum of 300 active subscribers on the webpage.

## Users
- Users can sign up with any email they want as long as it is valid.
- Users need to find their Toddle homework stream URL; view the tutorial [here](https://studysmartesf.netlify.app/src/videos/tutorial.mp4) - [source](/src/videos/tutorial.mp4).
- Users can choose whether they want to receive emails daily or not.
- On any day, a maximum of 300 active subscribers will receive the emails, while the others won't.

## AI Usage
- AI (Gemini) was used for:
  - All RegEx-related code
  - The retry code in timetable.js to prevent bugs
  - The async promise and pLimit code in email.js after timeouts occurred
  - Some colour palette choices and font choices
  - CSS for toggle switch
- AI code was always reviewed and modified based on the specific need. The AI never knew the full context and only made
fixes to small things; hence the modifications made.

## License
MIT License

Copyright (c) 2026 WIS

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

***Created by team WIS - Aarit JAIN, Aariv SHAH, Charlie FANG, Vedant Gandhi and Victor GURUNG***