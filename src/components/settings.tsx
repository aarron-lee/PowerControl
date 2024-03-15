import {
  PanelSection,
  PanelSectionRow,
  DialogButton,
  Focusable,
  quickAccessMenuClasses,
  ModalRoot,
  showModal,
  ScrollPanelGroup,
} from "decky-frontend-lib";
import MarkDownIt from "markdown-it";
import { useEffect, useState, VFC } from "react";
import { Backend } from "../util";
import { FaExclamationCircle } from "react-icons/fa";

const buttonStyle = {
  height: "28px",
  width: "40px",
  minWidth: 0,
  padding: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

export const QuickAccessTitleView: VFC<{ title: string }> = ({ title }) => {
  return (
    <Focusable
      style={{
        display: "flex",
        padding: "0",
        flex: "auto",
        boxShadow: "none",
      }}
      className={quickAccessMenuClasses.Title}
    >
      <div style={{ marginRight: "auto" }}>{title}</div>
      <DialogButton
        onOKActionDescription="RyzenAdj Info"
        style={buttonStyle}
        onClick={() => {
          showModal(<RyzenadjInfoModel />);
        }}
      >
        <FaExclamationCircle size="0.9em" />
      </DialogButton>
    </Focusable>
  );
};

export const RyzenadjInfoModel: VFC = ({
  closeModal,
}: {
  closeModal?: () => void;
}) => {
  const fontStyle: React.CSSProperties = {
    fontFamily: "Courier New",
    fontSize: "12px",
    lineHeight: "0.2", // 调整行距
    maxHeight: "300px", // 设置最大高度
    overflow: "auto", // 添加滚动条
    whiteSpace: "pre",
    margin: "10px 0",
  };

  // @ts-ignore
  const mdIt = new MarkDownIt({
    html: true,
  });

  const [info, setInfo] = useState<string>("");
  console.log(`fn:invoke RyzenadjInfoModel: ${info}`);

  useEffect(() => {
    Backend.getRyzenadjInfo().then((info) => {
      setInfo(info);
    });

    // 每5秒刷新一次
    const interval = setInterval(() => {
      Backend.getRyzenadjInfo().then((info) => {
        setInfo(info);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ModalRoot closeModal={closeModal}>
      <div>
        <PanelSection title={"Ryzenadj Info"}>
          <PanelSectionRow>
            <DialogButton
              onClick={() => {
                Backend.getRyzenadjInfo().then((info) => {
                  setInfo(info);
                });
              }}
            >
              Reload
            </DialogButton>
          </PanelSectionRow>
          <ScrollPanelGroup
            //@ts-ignore
            focusable={false}
          >
            <Focusable>
              <div style={fontStyle}>
                {info.split("\n").map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
              {/* <div dangerouslySetInnerHTML={{ __html: mdIt.render(info) }} /> */}
            </Focusable>
          </ScrollPanelGroup>
        </PanelSection>
      </div>
    </ModalRoot>
  );
};
