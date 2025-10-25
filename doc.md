Project: Focus Dashboard MVP
1. Core Concept
A personalized browser new-tab page designed to enhance user focus and productivity by centralizing essential daily information. The application will be a single-page, client-side React application with no backend dependency for its core features. All data will be persisted in the browser’s localStorage.

2. Technology Stack
UI Library: React.js (using Hooks)
State Management: React Hooks (useState, useEffect, useContext) for component-level and simple global state.
Styling: Tailwind CSS for a utility-first styling approach.
Data Persistence: Browser localStorage API.
Deployment Platform: Vercel, Netlify, or GitHub Pages.
3. Core Components (React Components)
The application will be composed of the following primary components:

Component	Responsibility
App	Main container, orchestrates all other components and manages global state.
Background	Manages the display of the background. For MVP, this can be a static, clean color or gradient.
Greeting	Displays a time-based greeting and the user’s name.
Clock	Displays the current time, updated in real-time.
Focus	Manages the display and state of the user’s “main focus for the day”.
Todo	Manages the to-do list functionality, including adding and managing TodoItems.
Weather	Fetches and displays current weather information.
4. Detailed Feature Specification
4.1. Greeting and User Name
Objective: To personalize the dashboard by greeting the user by name.
Initial State: On first load, the user’s name is null.
Behavior:
If userName is not found in localStorage, the UI must display an input field asking, “What is your name?”.
The user enters their name and presses Enter.
The entered name is stored in localStorage under the key focus_dashboard_userName.
On all subsequent loads, the component retrieves the name from localStorage.
The component must display a greeting that changes based on the current time of day:
05:00 - 11:59: “Good morning, [userName].”
12:00 - 17:59: “Good afternoon, [userName].”
18:00 - 23:59: “Good evening, [userName].”
00:00 - 04:59: “Good night, [userName].”
Data Structure: userName: string
4.2. Live Clock
Objective: Display the current time accurately.
Behavior:
The component must display the current time in HH:MM format (24-hour).
The time must update every second to stay in sync with the system clock. This should be implemented using setInterval within a useEffect hook.
User Interaction: None. This is a display-only component.
4.3. Main Focus for the Day
Objective: Allow the user to set and track one primary goal for the day.
Behavior:
If no focus is set for the day, display an input field with the placeholder “What is your main focus for today?”.
When the user types a focus and presses Enter, the input field is replaced by the displayed text.
The displayed focus text has a checkbox next to it. When checked, the text should receive a line-through style.
A “delete” or “reset” icon must be visible next to the focus text, allowing the user to clear it and set a new one.
State Object: { text: string, completed: boolean }
Data Persistence: The state object is stored as a JSON string in localStorage under the key focus_dashboard_focus. The state is cleared automatically at the start of a new day.
4.4. To-Do List
Objective: Provide a simple task management feature for daily tasks.
Behavior:
An input field at the bottom of the list allows users to add a new to-do item by typing and pressing Enter.
The list of to-dos is displayed vertically.
Each item in the list (TodoItem) must have:
A checkbox to mark it as complete (applies a line-through style to the text).
The to-do text.
A “delete” button (X) that removes the item from the list.
State Object: An array of to-do objects.
todos: Array<{ id: string, text: string, completed: boolean }>
id should be a unique identifier (e.g., Date.now() or a UUID).
Data Persistence: The todos array is stored as a JSON string in localStorage under the key focus_dashboard_todos.
4.5. Weather Widget
Objective: To display the current weather for the user’s location.
Behavior:
On first load (if city is unknown), prompt the user to enter their city name. Store it in localStorage.
On load, use the stored city name to make an API call to OpenWeatherMap.
Display the temperature in Celsius and a short weather description (e.g., “Clear Sky”).
To avoid excessive API calls, the fetched weather data should be cached in localStorage with a timestamp. A new API call should only be made if the cached data is older than 30 minutes.
Data Structure (State): weather: { temp: number, description: string, city: string } | null
Data Persistence:
focus_dashboard_city: string
focus_dashboard_weatherCache: { data: object, timestamp: number }
5. API Integration Contract
Service: OpenWeatherMap API
Endpoint: https://api.openweathermap.org/data/2.5/weather
Request Parameters:
q: City name provided by the user.
appid: The developer’s API key.
units: metric (to get temperature in Celsius).
Required Response Data (to be extracted from JSON):
main.temp: Current temperature.
weather[0].description: Weather condition text.
name: City name (to confirm the location).
6. User Flow Summary
First Visit:
App checks localStorage.
Prompts for userName. User enters it.
Prompts for city. User enters it.
Data is saved to localStorage.
Fetches weather via API.
Dashboard is now active.
Subsequent Visits:
App reads userName, city, focus, todos from localStorage.
Renders all components with saved data.
Checks weatherCache timestamp. If stale, fetches new weather data; otherwise, uses cached data.
Daily Interaction:
User sets/completes the main focus.
User adds/completes/deletes to-do items.
All changes are immediately persisted to localStorage.