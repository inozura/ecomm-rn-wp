import React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";

// Vector Fonts
import { FontAwesome } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";

//  Custom Components & Variables
import { COLORS } from "../variables/color";

const headerLogoURL = require("../assets/logo_header.png");

const TabScreenHeader = ({
  right,
  onRightClick,
  style,
  left,
  onLeftClick,
  rightIcon,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        height={50}
        maxWidth="38%"
        resizeMode="contain"
        source={headerLogoURL}
      />
      {right && (
        <TouchableOpacity style={styles.headerRight} onPress={onRightClick}>
          <FontAwesome name={rightIcon} size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
      {left && (
        <TouchableOpacity style={styles.headerLeft} onPress={onLeftClick}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerLeft: {
    position: "absolute",
    left: "2%",
  },
  headerRight: {
    position: "absolute",
    right: "6%",
  },
});

export default TabScreenHeader;
