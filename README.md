.env files:
packages/server/.env
contains 
EMAIL_USER=__________
EMAIL_PASS=__________
Get email_pass from https://myaccount.google.com/apppasswords 

# Real-Time Location Tracking and Visualization Dashboard

This project is a complete, end-to-end web application that allows a mobile device to broadcast its real-time GPS location to a central server, which then relays that location to a desktop web browser where the location is visualized live on an interactive map.

## Project Structure

The project is a monorepo with the following structure:

- `packages/server`: The Node.js Relay Server.
- `packages/responder`: The Mobile Client.
- `packages/dashboard`: The Desktop Dashboard Client.

## Setup and Execution

1.  **Install Dependencies:**

    Run the following command in the root directory of the project to install all the necessary dependencies for the server and clients:

    ```bash
    npm install
    ```

2.  **Run the Server:**

    Start the Relay Server by running the following command in the root directory:

    ```bash
    node packages/server/index.js
    ```

    The server will start on `https://localhost:3000`.

3.  **Access the Clients:**

    *   **Mobile Client:** Open a web browser on your mobile device and navigate to `https://<YOUR_COMPUTER_IP>:3000/packages/responder/index.html`.
    *   **Desktop Dashboard Client:** Open a web browser on your desktop and navigate to `https://localhost:3000/packages/dashboard/login.html`.

    **Important:** When you first access these URLs, your browser will display a security warning because the application uses a self-signed SSL certificate. You will need to bypass this warning to proceed. Look for an "Advanced" or "Details" option and then choose to "Proceed to..." the site. You will need to do this on both your desktop and mobile devices.

## First Responder Mode

The mobile client includes a "First Responder Mode." In this mode, the device will not only broadcast its own location but also receive the locations of all other "user" clients. It will identify the nearest user and display a large navigational arrow pointing toward their location. This arrow is oriented in real-world space using the phone's hardware compass.
