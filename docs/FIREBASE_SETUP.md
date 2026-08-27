# Firebase setup

Firebase Android configuration (`google-services.json`) is a local approved
file and is not committed unless explicitly designated safe. Firebase Admin
credentials remain server-side in Vercel/Render environment settings.

Required server variables are `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. Never place private keys
or service-account JSON in Git, plaintext Drive files, or documentation.
