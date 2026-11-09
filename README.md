App Store Connect Reviews: Looker Studio Connector

A free, open-source Looker Studio community connector that brings your Apple App Store customer reviews into Looker Studio, using Apple's official App Store Connect API.

Built and maintained by ZufaTech (ZUFATECH LLC) as a free community contribution.

Use the connector in Looker Studio · ZufaTech connectors

<img width="531" height="417" alt="Example Looker Studio report built with the connector" src="https://github.com/user-attachments/assets/144e4f84-b41a-4d40-a566-080a33e38d91" />
Why this connector

Looker Studio has no built-in way to read App Store reviews. Product, marketing and customer care teams usually copy reviews by hand or export CSV files, which is slow and never up to date.

This connector pulls reviews directly from Apple, so you can:

Track average rating over time
Filter reviews by country (territory), rating and date
Read and group review text to spot recurring issues or praise
Combine review data with other sources in one Looker Studio dashboard

It is listed in the Looker Studio partner connector gallery and is free to use.

Fields
Field	Type	Description
Review ID	Text	Unique ID of the review
Rating	Number	Star rating from 1 to 5
Title	Text	Review title
Body	Text	Full review text
Nickname	Text	Reviewer's App Store nickname
Territory	Text	Country or region of the App Store (e.g. USA, QAT)
Created Date	Date	Date the review was written

Reviews are returned newest first.

Before you start: create an App Store Connect API key

You need to be able to manage API keys in your App Store Connect account (usually the Account Holder or an Admin).

Sign in to App Store Connect.
Go to Users and Access > Integrations > App Store Connect API > Team Keys.
Click + to generate a new key. Give it a name (for example "Looker Studio reviews") and choose a role that can read customer reviews. Use the lowest-privilege role that works for your account; see Apple's documentation for role details.
Download the private key file (.p8). Apple lets you download it only once, so store it safely.
Note the Key ID (shown next to the key) and the Issuer ID (shown at the top of the page).
Find your App ID: in App Store Connect, open your app > App Information > Apple ID (a number such as 1234567890).
Setup in Looker Studio
Open the connector link and authorize it.
Fill in the configuration:
Setting	What to enter
App ID (numeric)	Your app's Apple ID, e.g. 1234567890
Key ID	From your App Store Connect API key
Issuer ID	From the App Store Connect API page
Private Key (.p8 content)	Open the .p8 file in a text editor and paste the full content. The BEGIN/END lines are optional.
Max rows to return	100, 200, 500 or 1000 most recent reviews
Click Connect, then Create report.
Suggested charts
Scorecard: average Rating
Time series: average Rating by Created Date (month)
Table or treemap: Body or Title, with Rating
Geo map or bar chart: review count by Territory
Controls: filters for Rating, Territory and date range
How it works
The connector builds a short-lived JSON Web Token (ES256, valid for 20 minutes) from your Key ID, Issuer ID and private key, as required by the App Store Connect API.
It calls GET /v1/apps/{appId}/customerReviews, sorted newest first, 200 reviews per page.
It follows the API's pagination until it reaches your row limit.
Temporary errors (HTTP 429 and 5xx) are retried up to 3 times with a short wait.
Only the fields used in your report are returned to Looker Studio.
Privacy and security
Your App Store Connect credentials are stored in your Looker Studio data source configuration and sent only to Apple's API (api.appstoreconnect.apple.com).
The connector does not store your credentials or review data anywhere else.
Anyone you give edit access to the data source may be able to see its configuration. Share reports as view-only, and use a dedicated, low-privilege API key that you can revoke at any time.
To revoke access, delete the key in App Store Connect under Users and Access > Integrations.
Deploy your own copy

You can run your own version of the connector:

Create a new project at script.google.com.
Copy Code.js (as Code.gs) and appsscript.json into the project. To edit the manifest, open Project Settings and tick Show "appsscript.json" manifest file in editor.
Add the jsrsasign library (MIT license) as a script file in the project. The connector uses it to sign the token (KJUR.jws.JWS.sign).
Update the dataStudio section of appsscript.json with your own name, logo and links.
Click Deploy > New deployment, choose Add-on, and use the deployment ID to open the connector in Looker Studio.
Files
File	Purpose
Code.js	Connector logic: configuration, schema, data fetching and token signing
appsscript.json	Apps Script manifest with Looker Studio connector settings
LICENSE	MIT license
Roadmap

ZufaTech is building more free Looker Studio connectors, including Meta Ads and TikTok Ads, as part of a wider marketing analytics platform. See connectors.zufatech.com.

Support and contributions
Found a bug or have an idea? Open an issue.
Pull requests are welcome.
More connectors: connectors.zufatech.com
License

Released under the MIT License. Copyright (c) 2026 ZUFATECH LLC.

Apple, App Store and App Store Connect are trademarks of Apple Inc. Looker Studio is a trademark of Google LLC. This project is not affiliated with or endorsed by Apple or Google.
