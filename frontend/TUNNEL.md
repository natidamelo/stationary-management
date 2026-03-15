# Open the app on your phone (HTTPS for camera scan)

Camera barcode scanning needs **HTTPS**. Use ngrok to get a secure URL.

## One-time setup (about 2 minutes)

1. **Sign up** (free): https://dashboard.ngrok.com/signup  
2. **Get your authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken  
3. **Set the token** (run once per terminal session, or add to your profile):

   **PowerShell:**
   ```powershell
   $env:NGROK_AUTHTOKEN="paste_your_token_here"
   ```

   **CMD:**
   ```cmd
   set NGROK_AUTHTOKEN=paste_your_token_here
   ```

## Every time you want to use the app on your phone

1. **Terminal 1 – backend**
   ```powershell
   cd "c:\Stationary managment system\backend"
   npm run start:dev
   ```

2. **Terminal 2 – frontend (LAN)**
   ```powershell
   cd "c:\Stationary managment system\frontend"
   npm run dev:lan
   ```

3. **Terminal 3 – tunnel**
   ```powershell
   cd "c:\Stationary managment system\frontend"
   npm run tunnel
   ```

4. In the tunnel terminal you’ll see something like:
   ```text
   Forwarding   https://abc123.ngrok-free.app -> http://localhost:5173
   ```

5. **On your phone** (same Wi‑Fi not required), open:
   - **Reception (camera scan):** `https://abc123.ngrok-free.app/reception`
   - Replace `abc123.ngrok-free.app` with the host from your tunnel.

6. Allow camera access when the browser asks. The scan area should show the camera feed.

Leave the tunnel terminal open while using the app on your phone. Press **Ctrl+C** in that terminal when you’re done.
