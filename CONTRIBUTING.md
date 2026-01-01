# Contributing to Todo Task Timer (TTT)

Thank you for your interest in contributing!

## Development Setup

1.  **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd timer2
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Start the local server**:
    ```bash
    npm start
    ```
    The app will run at `http://127.0.0.1:8080`.

## Code Quality

- **Linting**: Run `npm run lint` before committing.
- **Testing**: Run `npm test` to ensure all tests pass.
- **Formatting**: We follow standard JS styles.

## Git Workflow

- Create feature branches: `git checkout -b feature/my-feature`.
- Commit using conventional commits: `feat: add new timer`, `fix: logic error`.
- Push and open a Pull Request against `main`.

## Structure

- `script.js`: Main entry point.
- `runner.js`: Timer logic and playlist management.
- `ui.js`: DOM manipulation and rendering.
- `state.js`: Centralized state management.
- `actions.js`: Logic for user actions (add, delete, edit).
