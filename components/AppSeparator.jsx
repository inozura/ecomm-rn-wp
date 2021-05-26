import React from "react";
import { View, StyleSheet } from "react-native";

const AppSeparator = ({ style }) => {
  return <View style={[styles.container, style]} />;
};

const styles = StyleSheet.create({
  container: {
    height: 1,
    width: "95%",
    backgroundColor: "#cfcfcf",
  },
});

export default AppSeparator;
