import subprocess
import os
from config import logging,SH_PATH,RYZENADJ_PATH
#初始参数
cpu_boost=True
cpu_smt=True
enable_cpu_num=4
cpu_maxNum=0
cpu_tdpMax=15
cpu_avaFreq=[]
cpu_avaMaxFreq=1600000
cpu_avaMinFreq=1600000
cpu_nowLimitFreq=0

class CPUManager ():
    def get_hasRyzenadj(self):
        try:
            #查看ryzenadj路径是否有该文件
            if os.path.exists(RYZENADJ_PATH) or os.path.exists("/usr/bin/ryzenadj"):
                logging.info("get_hasRyzenadj {}".format(True))
                return True
            else:
                logging.info("get_hasRyzenadj {}".format(False))
                return False
        except Exception as e:
            logging.error(e)
            return False

    def get_ryzenadj_info(self):
        try:
            command = f"{RYZENADJ_PATH} -i"
            process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            stdout, stderr = process.stdout, process.stderr
            if stderr:
                logging.error(f"get_ryzenadj_info error:\n{stderr}")
                return f"get_ryzenadj_info error:\n{stderr}"
            else:
                return stdout
        except Exception as e:
            logging.error(e)
            return f"get_ryzenadj_info error:\n{e}"

cpuManager = CPUManager()
