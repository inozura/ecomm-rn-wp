import React from "react";
import { StyleSheet, TouchableOpacity, Text } from "react-native";

// Custom Components
import { COLORS } from "../variables/color";

const AppTextButton = ({ title, style, textStyle, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: COLORS.primary,
  },
});

export default AppTextButton;
