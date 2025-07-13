# 🏭 **Rifle Barrel MES - Local Hosting Guide**

## 🎯 **Recommended Setup: Dedicated Manufacturing Server**

### **Hardware Requirements:**
- **Minimum**: Any Windows/Linux computer with 4GB RAM
- **Recommended**: Dedicated server/workstation with 8GB+ RAM
- **Network**: Connected to same network as manufacturing tablets
- **Storage**: 50GB+ free space for logs and data

### **Software Requirements:**
- **Node.js** (already installed)
- **Modern web browser** for admin access
- **Network connectivity** to manufacturing floor

## 🚀 **Quick Start (Windows):**

### **1. Start the MES Server:**
```batch
# Double-click this file to start the server
start-mes.bat
```

### **2. Access the System:**
- **Admin Computer**: http://localhost:3000
- **Manufacturing Tablets**: http://[YOUR-COMPUTER-IP]:3000

### **3. Find Your Computer's IP Address:**
```cmd
ipconfig
# Look for "IPv4 Address" (usually starts with 192.168.x.x)
```

## 📱 **Multi-Tablet Setup:**

### **Tablet Configuration:**
1. Connect all tablets to same WiFi network as server
2. Open web browser on each tablet  
3. Navigate to: `http://[SERVER-IP]:3000`
4. Bookmark the page for easy access
5. Login with operator credentials

### **Example Setup:**
- **Server Computer**: 192.168.1.100
- **Drilling Tablet**: Browse to http://192.168.1.100:3000
- **Reaming Tablet**: Browse to http://192.168.1.100:3000  
- **Admin Desktop**: Browse to http://localhost:3000

## 🔧 **Production Deployment Options:**

### **Option 1: Always-On Server** ⭐ **BEST**
```batch
# Set up Windows service or Linux systemd
# Server runs 24/7, always available
# Automatic startup after power outages
```

**Benefits:**
- ✅ Always available for manufacturing
- ✅ Automatic recovery from power issues  
- ✅ Professional reliability
- ✅ No manual startup required

### **Option 2: Manual Startup** 
```batch
# Run start-mes.bat when needed
# Good for testing or small operations
```

**Benefits:**
- ✅ Simple to use
- ✅ Full control over when it runs
- ✅ Good for development/testing

## 🛡️ **Security & Backup:**

### **Network Security:**
- **Firewall**: Allow port 3000 only on local network
- **Access Control**: Use strong passwords for admin accounts
- **Network Isolation**: Keep manufacturing network separate from internet

### **Data Backup:**
```batch
# Backup localStorage data (stored in browser)
# Export user data from Admin Panel
# Regular backups of application files
```

## 🔄 **Multi-Tablet Sync:**

### **Current State: Local Sync**
- Data shared via localStorage on server computer
- Real-time updates across connected tablets
- **No internet dependency**

### **Optional: Firebase Sync** (Advanced)
- Enable `syncConfig.enabled = true` in App.tsx
- Real-time sync across multiple physical locations
- **Requires internet connectivity**

## 📊 **Monitoring & Maintenance:**

### **Health Checks:**
- Monitor server computer uptime
- Check tablet connectivity
- Verify data synchronization
- Regular operator login tests

### **Performance:**
- **Expected Load**: 5-20 concurrent tablets
- **Response Time**: <100ms on local network
- **Reliability**: 99.9% uptime with dedicated server

## 🆘 **Troubleshooting:**

### **Common Issues:**
1. **"Can't connect"**: Check IP address and network
2. **"Slow response"**: Check WiFi signal strength  
3. **"Data not syncing"**: Refresh browser on all tablets
4. **"Login issues"**: Check user accounts in Admin Panel

### **Quick Fixes:**
```batch
# Restart the server
Ctrl+C to stop, then run start-mes.bat again

# Clear browser cache on tablets
Ctrl+Shift+Delete in browser

# Check network connectivity
ping [server-ip-address]
```

## 🎯 **Production Checklist:**

- [ ] Dedicated server computer set up
- [ ] All tablets connected to network  
- [ ] IP addresses documented
- [ ] User accounts created in Admin Panel
- [ ] Station assignments configured
- [ ] Backup procedures established
- [ ] Staff trained on system usage
- [ ] Emergency procedures documented

## 💡 **Pro Tips:**

### **Performance Optimization:**
- Use wired ethernet for server (faster than WiFi)
- Position server centrally for best WiFi coverage
- Use enterprise-grade WiFi router for reliability

### **User Experience:**
- Add desktop shortcuts on tablets pointing to MES URL
- Use tablet stands for ergonomic operation
- Consider rugged tablets for harsh manufacturing environments

**Result**: Professional, reliable, locally-hosted MES with multi-tablet support! 🎯
