import sys
import decky_plugin
from settings import SettingsManager

# 获取插件路径 加载backend中各个py文件

HOMEBREW_PATH = f'{decky_plugin.DECKY_USER_HOME}/homebrew'   
from config import logging, CONFIG_KEY
from cpu import cpuManager
from fan import fanManager
from sysInfo import sysInfoManager
import update


class Plugin:
    async def _main(self):
        self.settings = SettingsManager(
            name="config", settings_directory=decky_plugin.DECKY_PLUGIN_SETTINGS_DIR
        )

    async def get_settings(self):
        return self.settings.getSetting(CONFIG_KEY)
    
    async def set_settings(self, settings):
        self.settings.setSetting(CONFIG_KEY, settings)
        logging.info(f"save Settings: {settings}")
        return True

    async def _unload(self):
        logging.info("End PowerControl")

    async def get_hasRyzenadj(self):
        try:
            return cpuManager.get_hasRyzenadj()
        except Exception as e:
            logging.error(e)
            return False


    async def get_language(self):
        try:
            return sysInfoManager.get_language()
        except Exception as e:
            logging.error(e)
            return ""

    async def get_fanRPM(self, index):
        try:
            return fanManager.get_fanRPM(index)
        except Exception as e:
            logging.error(e)
            return 0

    async def get_fanRPMPercent(self, index):
        try:
            return fanManager.get_fanRPMPercent(index)
        except Exception as e:
            logging.error(e)
            return 0

    async def get_fanTemp(self, index):
        try:
            return fanManager.get_fanTemp(index)
        except Exception as e:
            logging.error(e)
            return 0

    async def get_fanIsAuto(self, index):
        try:
            return fanManager.get_fanIsAuto(index)
        except Exception as e:
            logging.error(e)
            return 0

    async def get_fanConfigList(self):
        try:
            return fanManager.get_fanConfigList()
        except Exception as e:
            logging.error(e)
            return []

    async def set_fanAuto(self, index: int, value: bool):
        try:
            return fanManager.set_fanAuto(index, value)
        except Exception as e:
            logging.error(e)
            return False

    async def set_fanPercent(self, index: int, value: int):
        try:
            return fanManager.set_fanPercent(index, value)
        except Exception as e:
            logging.error(e)
            return False

    async def receive_suspendEvent(self):
        try:
            return True
        except Exception as e:
            logging.error(e)
            return False

    async def update_latest(self):
        logging.info("Updating latest")
        return update.update_latest()

    async def get_version(self):
        return update.get_version()

    async def get_latest_version(self):
        return update.get_latest_version()

    async def get_ryzenadj_info(self):
        return cpuManager.get_ryzenadj_info()
