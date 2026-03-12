Deltabotix API (Backend)

This server runs on port 3000.
The user should run it on their PC where the Arduino is connected. Then the browser will automatically detect the available ports, and the Upload feature will upload the code directly to the Arduino via USB — no separate application is required.

Run
cd /home/moglix/Desktop/my2/backend-api
npm start

Or run in development mode (auto reload):

npm run dev
Endpoints

GET /api/v1/kits – Get the list of kits

GET /api/v1/projects – Get the list of projects

POST /api/v1/projects – Create a new project

PUT /api/v1/projects/:id – Update an existing project

POST /api/v1/firmware/generate – Convert Blockly XML → Arduino code

POST /api/v1/firmware/assemble – Generate the full .ino firmware file

There is no separate “local upload server.”

GET /api/v1/upload/ports – Get the list of USB ports (for the dropdown)

POST /api/v1/upload – Compile and upload the code

Request body: code, board, port

Full Stack

Backend — Run on the user’s PC where Arduino is connected

npm start

Runs on port 3000

Frontend

cd ../frontend
npm run dev

Runs on port 3001

User Flow

Connect the Arduino to the computer.

Open the web application in the browser.

Go to the Run → Upload tab.

Click Refresh Ports to detect available USB ports.

Select the appropriate port.

Click Upload to compile and upload the code.

Everything works directly from the browser.
