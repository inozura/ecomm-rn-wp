import React from "react";

//  External Libraries
import LottieView from "lottie-react-native";

const UploadingIndicator = ({ onDone }) => {
  // if (!visible) return null;
  return (
    <LottieView
      autoPlay
      loop={true}
      source={require("../assets/animations/uploading.json")}
      onAnimationFinish={onDone}
    />
  );
};

export default UploadingIndicator;
