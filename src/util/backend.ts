import { ServerAPI } from "decky-frontend-lib";
import { APPLYTYPE, FANMODE } from "./enum";
import { FanControl } from "./pluginMain";
import { Settings, SettingsData } from "./settings";
import { JsonSerializer } from "typescript-json-serializer";

const serializer = new JsonSerializer();

export class BackendData {
  private serverAPI: ServerAPI | undefined;
  private fanConfigs: any[] = [];
  private has_fanConfigs = false;
  private current_version = "";
  private latest_version = "";
  public async init(serverAPI: ServerAPI) {
    this.serverAPI = serverAPI;

    await this.serverAPI!.callPluginMethod<{}, []>(
      "get_fanConfigList",
      {}
    ).then((res) => {
      if (res.success) {
        // console.info("fanConfigList", res.result);
        this.fanConfigs = res.result;
        this.has_fanConfigs = true;
      } else {
        this.has_fanConfigs = false;
      }
    });

    await this.serverAPI!.callPluginMethod<{}, string>("get_version", {}).then(
      (res) => {
        if (res.success) {
          console.info("current_version = " + res.result);
          this.current_version = res.result;
        }
      }
    );
  }

  public getFanMAXPRM(index: number) {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.[index]?.fan_max_rpm ?? 0;
    }
    return 0;
  }

  public getFanCount() {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.length ?? 0;
    }
    return 0;
  }

  public getFanName(index: number) {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.[index]?.fan_name ?? "Fan";
    }
    return "Fan";
  }

  public getFanConfigs() {
    if (this.has_fanConfigs) {
      return this.fanConfigs;
    }
    return [];
  }

  public getFanHwmonMode(index: number) {
    if (this.has_fanConfigs) {
      return this.fanConfigs?.[index]?.fan_hwmon_mode ?? 0;
    }
    return 0;
  }

  public getCurrentVersion() {
    return this.current_version;
  }

  public getLatestVersion() {
    return this.latest_version;
  }

  public async getFanRPM(index: number) {
    var fanPRM: number;
    await this.serverAPI!.callPluginMethod<{ index: number }, number>(
      "get_fanRPM",
      { index: index }
    ).then((res) => {
      //console.log("get_fanRPM res=",res,"index=",index)
      if (res.success) {
        fanPRM = res.result;
      } else {
        fanPRM = 0;
      }
    });
    return fanPRM!!;
  }

  public async getFanTemp(index: number) {
    var fanTemp: number;
    await this.serverAPI!.callPluginMethod<{ index: number }, number>(
      "get_fanTemp",
      { index: index }
    ).then((res) => {
      if (res.success) {
        fanTemp = res.result / 1000;
      } else {
        fanTemp = -1;
      }
    });
    return fanTemp!!;
  }

  public async getFanIsAuto(index: number) {
    var fanIsAuto: boolean;
    await this.serverAPI!.callPluginMethod<{ index: number }, boolean>(
      "get_fanIsAuto",
      { index: index }
    ).then((res) => {
      if (res.success) {
        fanIsAuto = res.result;
      } else {
        fanIsAuto = false;
      }
    });
    return fanIsAuto!!;
  }
}

export class Backend {
  private static serverAPI: ServerAPI;
  public static data: BackendData;
  public static async init(serverAPI: ServerAPI) {
    this.serverAPI = serverAPI;
    this.data = new BackendData();
    await this.data.init(serverAPI);
  }

  private static applyFanAuto(index: number, auto: boolean) {
    this.serverAPI!.callPluginMethod("set_fanAuto", {
      index: index,
      value: auto,
    });
  }

  private static applyFanPercent(index: number, percent: number) {
    this.serverAPI!.callPluginMethod("set_fanPercent", {
      index: index,
      value: percent,
    });
  }
  public static throwSuspendEvt() {
    console.log("throwSuspendEvt");
    this.serverAPI!.callPluginMethod("receive_suspendEvent", {});
  }

  public static async getLatestVersion(): Promise<string> {
    return (await this.serverAPI!.callPluginMethod("get_latest_version", {}))
      .result as string;
  }

  // updateLatest
  public static async updateLatest() {
    await this.serverAPI!.callPluginMethod("update_latest", {});
  }

  // get_ryzenadj_info
  public static async getRyzenadjInfo(): Promise<string> {
    return (await this.serverAPI!.callPluginMethod("get_ryzenadj_info", {}))
      .result as string;
  }

  // set_settings
  public static async setSettings(settingsData: SettingsData) {
    const obj = serializer.serializeObject(settingsData);
    await this.serverAPI!.callPluginMethod("set_settings", {
      settings: obj,
    });
  }

  // get_settings
  public static async getSettings(): Promise<SettingsData> {
    const res = await this.serverAPI!.callPluginMethod("get_settings", {});
    if (!res.success) {
      return new SettingsData();
    }
    return (
      serializer.deserializeObject(res.result, SettingsData) ??
      new SettingsData()
    );
  }

  public static applySettings = (applyTarget: string) => {
    if (!Settings.ensureEnable()) {
      Backend.resetSettings();
      return;
    }

    if (
      applyTarget == APPLYTYPE.SET_ALL ||
      applyTarget == APPLYTYPE.SET_FANRPM
    ) {
      if (!FanControl.fanIsEnable) {
        return;
      }
      const fanSettings = Settings.appFanSettings();
      for (var index = 0; index < fanSettings.length; index++) {
        var fanSetting = Settings.appFanSettings()?.[index];
        //没有配置时转自动
        if (!fanSetting) {
          Backend.applyFanAuto(index, true);
          // console.log(`没有配置 index= ${index}`);
          continue;
        }
        const fanMode = fanSetting.fanMode;
        //写入转速后再写入控制位
        if (fanMode == FANMODE.NOCONTROL) {
          // console.log(`不控制 index= ${index}`);
          Backend.applyFanAuto(index, true);
        } else if (fanMode == FANMODE.FIX) {
          // console.log(`直线 index= ${index}`);
          Backend.applyFanPercent(
            index,
            FanControl.fanInfo[index].setPoint.fanRPMpercent!!
          );
          Backend.applyFanAuto(index, false);
        } else if (fanMode == FANMODE.CURVE) {
          // console.log(`曲线 index= ${index}`);
          Backend.applyFanPercent(
            index,
            FanControl.fanInfo[index].setPoint.fanRPMpercent!!
          );
          Backend.applyFanAuto(index, false);
        } else {
          console.error(`出现意外的FanMode = ${fanMode}`);
        }
      }
    }
  };

  public static resetFanSettings = () => {
    FanControl.fanInfo.forEach((_value, index) => {
      Backend.applyFanAuto(index, true);
    });
  };

  public static resetSettings = () => {
    console.log("重置所有设置");
    FanControl.fanInfo.forEach((_value, index) => {
      Backend.applyFanAuto(index, true);
    });
  };
}
