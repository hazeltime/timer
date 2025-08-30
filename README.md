# Todo Task Timer (TTT)

An advanced timer application designed for managing and executing task-based sessions. Built with vanilla HTML, CSS, and JavaScript, this tool helps you structure your work, breaks, and other activities into a configurable, multi-lap playlist.

![TTT Screenshot](placeholder.png) ## ✨ Features

- **Task Repository**: Create, edit, duplicate, and delete tasks.
- **Advanced Task Properties**:
  - **Categories**: Organize tasks with icons and colors.
  - **Lap Interval**: Schedule tasks to run every N laps.
  - **Duration Growth/Decay**: Automatically increase or decrease a task's duration by a percentage each time it runs.
  - **Max Occurrences**: Limit how many times a task can appear in a session.
- **Lap Playlist**: Build a session playlist by adding tasks from the repository. Reorder tasks with drag-and-drop.
- **Powerful Task Runner**:
  - Run sessions with a specified number of laps.
  - Detailed progress bars for the current task, current lap, and the entire session.
  - Real-time stats including elapsed/remaining time, duration changes, and occurrence count.
  - Controls to play/pause, skip to the next/previous task, and navigate between laps.
- **Persistent State**: All tasks and your current playlist are automatically saved to your browser's LocalStorage.
- **Theming**: Switch between light and dark modes.
- **Responsive Design**: Usable on both desktop and mobile devices.

## 🚀 Getting Started

To run this project locally, you will need to have Node.js and npm installed.

### Prerequisites

- [Node.js (LTS version)](https://nodejs.org/) - npm is included with the Node.js installation.

### Installation & Setup

1.  **Clone the repository:**

    ```sh
    git clone <your-repository-url>
    cd timer
    ```

2.  **Install dependencies:**
    This project uses [Parcel](https://parceljs.org/) as a development server and bundler. The following command will install it based on the `package.json` file.
    ```sh
    npm install
    ```

### Running the Application

Once the dependencies are installed, you can start the development server:

```sh
npm run dev
```
