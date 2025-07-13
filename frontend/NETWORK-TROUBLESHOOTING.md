# Troubleshooting Network Access for MES System

## Quick Fixes:

### 1. Run Firewall Script as Administrator
- Right-click `allow-firewall.bat` → "Run as administrator"
- This allows port 3000 through Windows Firewall

### 2. Try These URLs on Your Phone:
- http://192.168.1.238:3000/
- http://172.25.208.1:3000/

### 3. Check Your Phone's WiFi:
- Make sure your phone is on the SAME WiFi network as this computer
- Not on mobile data or guest network

### 4. Verify Network Connection:
From your phone, try pinging the computer:
- Use a network tool app to ping: 192.168.1.238

### 5. Alternative: Temporarily Disable Firewall (Testing Only)
⚠️ **Security Warning**: Only for testing, re-enable afterwards!
- Windows Settings → Update & Security → Windows Security
- Firewall & network protection → Turn off firewall (temporarily)
- Test access from phone
- Turn firewall back on immediately after testing

### 6. Check Router Settings:
Some routers have "AP Isolation" or "Client Isolation" enabled:
- This prevents devices from communicating with each other
- Check router admin panel for these settings

### 7. Use Different Port (If Needed):
If port 3000 is blocked by your network:
```
npm run dev -- --port 8080 --host 0.0.0.0
```
Then access: http://192.168.1.238:8080/

## Network Information:
- Computer IP: 192.168.1.238 (primary)
- Computer IP: 172.25.208.1 (secondary)  
- Server Port: 3000
- Server Status: ✅ Running with network access enabled

## Success Indicators:
✅ Server running on both IP addresses
✅ Network access enabled (--host 0.0.0.0)
⚠️ Firewall rule needed (run allow-firewall.bat as admin)

## Manufacturing Floor Deployment:
Once working, all tablets on the same network can access:
- Main interface: http://192.168.1.238:3000/
- Admin panel: Access through login with admin credentials
- Real-time sync: Each tablet sees live updates from others
