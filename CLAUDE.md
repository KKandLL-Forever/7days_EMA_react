# 项目说明

## 启动方式

根目录运行：
```
npm run dev
```
同时启动前端（5173）和后端（3001）。

## 测试后清理

测试完毕后必须清除占用的端口，否则下次启动报 EADDRINUSE：

```bash
# 查找并杀掉占用 3001 和 5173 的进程
cmd /c "for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /PID %a /F"
cmd /c "for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /PID %a /F"
```
