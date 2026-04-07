chcp 65001
@REM echo "%cd%"

@REM set DB_NAME=D:\1С\_1C_BASE\БСП демо 3.1.11
@REM set CFEPATH="D:\Repo\1\OneKanban"

@REM call vrunner decompileext "OneKanban" %CFEPATH% --ibconnection /F"%DB_NAME%" --db-user Администратор --v8version 8.3.27

@REM if errorlevel 1 (
@REM   echo "Декомпиляция не удалась, дальше не идем"
@REM   exit /b 1
@REM )

@REM call vrunner compileexttocfe --src %CFEPATH% --out D:/Repo/Kanban_for_1C/Releases/OneKanban_BSP_auto.cfe --v8version 8.3.27

oscript sys-info.os

pause