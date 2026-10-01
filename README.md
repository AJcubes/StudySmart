<h1>
  <p align="center">
    <a href="https://studysmartesf.netlify.app/" target="_blank">
      <img src="/src/images/favicon.png" alt="Logo" height="108">
      <br>
      StudySmart
    </a>
  </p>
</h1>
<p align="center">
    A website that lets Toddle students view their homework in a comfortable interface alongside daily emails.
</p>

---

## Pitch

https://github.com/user-attachments/assets/08e7a023-4d09-4af2-8754-e22968befa64

*[Pitch Deck](https://studysmartesf.netlify.app/src/docs/pitch.pdf)*

## SDG Goals
Our website aligns with SDG 3 - Good Health and Well-Being. We aim to help students stress less and study more.

## Features

https://github.com/user-attachments/assets/be86fd8e-6f51-48bf-954d-b36fdfda6b65

*[Source](https://studysmartesf.netlify.app/src/videos/features.mp4)*

- [x] Store preferences for the user's timetable URL and whether they want to receive emails.
- [x] Send an email at 15:30 HKT every weekday and at 10:00 HKT every weekend.
- [x] Homework is displayed in an easy-to-read format so as not to stress the user.
- [ ] Add more colour modes like dark mode or colour-blind mode.
- [ ] Add a smart AI chatbot for users to converse with.
- [ ] Add some mental health tips and tricks to stay on top of your grades.

## Usage
Go to the [website](https://studysmartesf.netlify.app/) and sign up! Follow the [instructions](#instructions) below if necessary.

## Technology Stack

https://github.com/user-attachments/assets/0b66c7f6-ce3b-4e82-9a75-076c453657ee

*[Source](https://studysmartesf.netlify.app/src/videos/backend.mp4)*

- The files [email.js](/src/js/email.js) and [api.js](/netlify/functions/api.js) use [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) to store user data in the cloud.
- The file [api.js](/netlify/functions/api.js) uses [Netlify Functions](https://docs.netlify.com/build/functions/overview/) to access the user data and modify it from the website.
- The files [weekdays.js](/netlify/functions/weekdays.js) and [weekends.js](/netlify/functions/weekends.js) use [Netlify Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/) to email all the users once every day.
- The file [email.js](/src/js/email.js) uses the [Brevo API](https://developers.brevo.com/docs/batch-send-transactional-emails) to batch-send each user a custom email.
- The file [timetable.js](/src/js/timetable.js) uses [node-ical](https://github.com/jens-maus/node-ical) to parse the timetables found.
- The file [email.js](/src/js/email.js) uses [pLimit](https://github.com/sindresorhus/p-limit) to throttle the network requests to speed up the code.

## Emails
- The emails are sent on these days:
  - Weekdays - 15:30 HKT
  - Weekends - 10:00 HKT
- You will receive the email from "ajcubes33@12226934.brevosend.com". Be sure to check your spam/junk folder if necessary!
- The Brevo API provides a maximum of 300 emails per day, leading to a maximum of 300 active subscribers on the website.

## Instructions

https://github.com/user-attachments/assets/01aafca0-1568-4de2-8d05-c025885984fb

*[Source](https://studysmartesf.netlify.app/src/videos/tutorial.mp4)*

- Users can sign up with any email they want as long as it is valid.
- Users need to find their Toddle homework stream URL.
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

***Created by team WIS - Aarit Jain, Aariv Shah, Charlie Fang, Vedant Gandhi and Victor Gurung***