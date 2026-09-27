# Split_it

## Overview

**Split_it** is a full-stack MERN web application designed to simplify group expense management and bill tracking. It allows users to form groups via shareable invite links, record shared expenses with custom or equal split options, track pending and settled payments, and view audit history. Additionally, an automated background worker sends email reminders to members prior to payment deadlines.

## Features

* **User Registration & Email Verification**: Account registration with token-based email activation and login authentication.
* **Group Management**: Create expense groups and invite members via shareable join links.
* **Flexible Expense Splitting**: Create splits across group members with options for equal division or custom amount allocation per member.
* **Payment Tracking & Settlement**: Categorize expenses into pending and settled status, track individual member debts, and mark payments as settled.
* **Automated Email Reminders**: Scheduled background cron job sends automated email notifications to members with unpaid balances 1 day prior to the payment due date.
* **Interactive Dashboard**: Visual analytics showing category spending breakdown, total pending vs. settled balances, user activity metrics, and quick action shortcuts.
* **Transaction & Audit History**: Maintain full audit logs of expense creations, updates, settlements, and activity events.
* **User Feedback & Reviews**: Submit app reviews and feedback through an interactive interface.

## Tech Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, React Router DOM v7, Chart.js, Recharts, Lucide React, FontAwesome.
* **Backend**: Node.js, Express.js, MongoDB, Mongoose, Nodemailer, UUID.
* **Background Worker**: Node.js, Mongoose, Nodemailer (compatible with standalone execution or GitHub Actions cron workflows).

## Project Structure

```text
Split_it/
├── backend/                # Express REST API server
│   ├── models/             # Mongoose schemas (Users, Split, Group, Review)
│   ├── routes/             # Express API route handlers
│   ├── mailer.js           # Nodemailer transport setup
│   ├── index.js            # Backend entry point
│   ├── .env.example        # Environment variables template
│   └── package.json        # Backend dependencies & scripts
│
├── frontend/               # React + Vite client application
│   ├── public/             # Static assets
│   ├── src/                # React components, pages, styling
│   ├── .env.example        # Frontend environment variables template
│   ├── package.json        # Frontend dependencies & scripts
│   └── vite.config.js      # Vite build configuration
│
├── cron-worker/            # Background worker for payment reminders
│   ├── models/             # Mongoose schemas
│   ├── data/               # Currency helper metadata
│   ├── sendReminders.js    # Reminder calculation & email dispatch logic
│   ├── mailer.js           # Nodemailer transport setup for worker
│   ├── index.js            # Worker entry point
│   ├── .env.example        # Worker environment variables template
│   └── package.json        # Worker dependencies & scripts
│
├── .github/
│   └── workflows/
│       └── cron-job.yml    # GitHub Actions scheduled workflow
│
└── .gitignore              # Git ignore rules
```

## Setup

### Prerequisites

* Node.js (v18 or higher recommended)
* npm (Node Package Manager)
* MongoDB instance (local or MongoDB Atlas)
* SMTP credentials (optional, for sending verification emails and reminder notifications)

### Installation

1. Clone the repository into your local workspace.
2. Install dependencies for each sub-project:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install cron-worker dependencies
cd ../cron-worker
npm install
```

### Environment Variables

Configure `.env` files for each component by copying the provided `.env.example` templates:

#### Backend (`backend/.env`)
```env
PORT=3001
CLIENT_URL=http://localhost:5173
BASE_URL=http://localhost:3001
MONGO_URI=mongodb://127.0.0.1:27017/split_it
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3001
```

#### Cron Worker (`cron-worker/.env`)
```env
MONGO_URI=mongodb://127.0.0.1:27017/split_it
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### Starting the Application

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm start
   ```
   *The API server will run on `http://localhost:3001` (or `npm run dev` for auto-reloading with Nodemon).*

2. **Start the Frontend Client**:
   ```bash
   cd frontend
   npm run dev
   ```
   *The web app will run on `http://localhost:5173`.*

3. **Run the Reminder Worker (Optional)**:
   ```bash
   cd cron-worker
   npm start
   ```
   *Executes the reminder check process to dispatch email notifications for upcoming due dates.*

## Future Improvements

*(Planned future enhancements - not currently implemented)*

* **Receipt & Proof Uploads**: Attachment of payment receipts or bill images to expense records.
* **Push Notifications**: Real-time browser and mobile notifications for new expense splits and settlements.
* **Multi-Currency Conversion**: Live currency conversion rates for international group expenses.
* **Export Expense Reports**: Export group balances and transaction histories to PDF or CSV formats.
