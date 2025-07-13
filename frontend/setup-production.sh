#!/bin/bash

# Rifle Barrel MES - Production Deployment Script

echo "🏭 Setting up Rifle Barrel MES for Production..."

# Install production dependencies
echo "📦 Installing dependencies..."
npm install

# Create production start script
echo "🚀 Creating production start script..."
cat > start-mes.sh << 'EOF'
#!/bin/bash
echo "🏭 Starting Rifle Barrel MES..."
echo "📡 Server will be available at:"
echo "   Local:  http://localhost:3000"
echo "   Network: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start the development server on port 3000
npm run dev -- --port 3000 --host 0.0.0.0
EOF

chmod +x start-mes.sh

# Create Windows batch file
cat > start-mes.bat << 'EOF'
@echo off
echo 🏭 Starting Rifle Barrel MES...
echo 📡 Server will be available at:
echo    Local:  http://localhost:3000
echo    Network: http://%COMPUTERNAME%:3000
echo.
echo 🛑 Press Ctrl+C to stop the server
echo.

npm run dev -- --port 3000 --host 0.0.0.0
EOF

echo "✅ Production setup complete!"
echo ""
echo "🚀 To start the MES server:"
echo "   Linux/Mac: ./start-mes.sh"
echo "   Windows:   start-mes.bat"
echo ""
echo "📱 Access from tablets using your computer's IP address"
