import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";

// Vector Icons
import { FontAwesome } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";

const ListingHeader = ({
  onBack,
  onFavorite,
  title,
  style,
  author,
  is_favourite,
  favoriteDisabled,
}) => {
  const [{ user }] = useStateValue();

  return (
    <View style={[styles.container, styles.flexRow, style]}>
      <View style={styles.flexRow}>
        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.flexRow}>
        {user !== null && user.id !== author && !!author && (
          <View>
            <TouchableOpacity onPress={onFavorite} disabled={favoriteDisabled}>
              <FontAwesome
                name={is_favourite ? "star" : "star-o"}
                size={25}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    paddingHorizontal: "3%",
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    height: 50,
    backgroundColor: COLORS.primary,
  },
  flexRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  headerTitle: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 20,
    paddingLeft: "3%",
  },
  shareButton: {
    width: 30,
  },
});

export default ListingHeader;
