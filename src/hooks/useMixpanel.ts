import { useContext } from "react";
import MixpanelContext from "@/contexts/MixpanelContext";

export const useMixpanel = () => {
  const context = useContext(MixpanelContext);
  if (context === undefined) {
    throw new Error("useMixpanel must be used within a MixpanelProvider");
  }
  return context;
};

export default useMixpanel;
