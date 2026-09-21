# Field Traceability Mobile Client

A mobile client for recording field traceability events across marine plastic collection, recycling, and manufacturing workflows.
### Project demonstration
A real-world project demonstration is available in this [video walkthrough](https://youtu.be/P9QTiQ37r1I).

### Operational Flow
**1. At the Port:**
- Port coordinators weigh the fisherman’s waste collection and scan their ID card.
- Data is submitted and attested using the port coordinator’s wallet.

**2. Waste Collection Transportation:**
- When onsite containers reach capacity, the waste is shipped to the recycler.

**3. At the Recycler:**
- The recycler weighs the container using a weighbridge, generating a weight slip.
- The recycler sorts the materials and logs the sorted data with identifier codes in the app, submitting the data with an attestation.
- When raw materials like pellets are produced, the recycler records the quantity and makes a final attestation.

**4. To the Manufacturer:**
- Pellets are shipped to the manufacturer.
- The manufacturer records the production of end-user products, entering data and making attestations.

### Design Principles

The field traceability mobile client is designed with the users’ physical and digital constraints in mind:
- Offline-first approach: Recognizing limited internet access at many sites, the app operates offline, storing data locally until a connection is available for submission and attestation.
- Flexible UX: With operational workflows varying across countries, the user experience is designed to be generic, ensuring adaptability to different scenarios.


---------------------

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).


----
## License
This project is licensed under the GNU Affero General Public License v3.0. See [LICENSE.md](LICENSE.md).

Copyright © 2024-2026 Pollen Labs.
