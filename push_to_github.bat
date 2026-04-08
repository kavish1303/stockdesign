@echo off
color 0a
echo ===========================================
echo  PLEASE READ THIS: DO NOT CLOSE THIS WINDOW
echo ===========================================
echo.
echo A GitHub sign-in window is going to pop up.
echo Please click "Sign in with your browser".
echo.
echo After you authenticate, this window will automatically upload your code to GitHub.
cd /d "%~dp0"
"C:\Program Files\Git\cmd\git.exe" push -u origin main
echo.
echo ALL DONE! Your code is now physically uploaded to GitHub.
pause
