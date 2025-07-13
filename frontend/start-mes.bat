@echo off
echo 🏭 Starting Rifle Barrel MES...
echo 📡 Server will be available at:
echo    Local:  http://localhost:3000
echo    Network: Check your computer's IP address
echo.
echo 🛑 Press Ctrl+C to stop the server
echo.

npm run dev -- --port 3000 --host 0.0.0.0
