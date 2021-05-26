import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  ScrollView,
  Image,
} from "react-native";
import { COLORS } from "../variables/color";
import AppButton from "../components/AppButton";
import AppSeparator from "../components/AppSeparator";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";

const myMembershipScreenTexts = {
  title: "Become our member!",
  membershipText:
    "Membership gives your business a voice and presence on our platform to reach more customers,increase your sales and expand your business! Memberships unlock powerful tools like sales analytics, a dedicated business page and discounted ad promotions.",
  learnMoreButtontitle: "Learn More",
  membershipURL:
    "https://radiustheme.com/demo/wordpress/classifiedpro/checkout/membership/", //This is temporary.
};

const MyMembershipScreen = () => {
  const [{ appSettings }] = useStateValue();
  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.mainWrap}>
          <View style={styles.titleWrap}>
            <View
              style={{
                height: 25,
                width: 25,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                backgroundColor: COLORS.bg_dark,
              }}
            >
              <Image
                height={25}
                maxWidth="100%"
                resizeMode="contain"
                // eslint-disable-next-line no-undef
                source={require("../assets/membership_icon.png")}
              />
            </View>
            <Text style={styles.title}>
              {__("myMembershipScreenTexts.title", appSettings.lng)}
            </Text>
          </View>
          <AppSeparator style={styles.separator} />
          <View style={styles.membershipTextWrap}>
            <Text style={styles.membershipText}>
              {__("myMembershipScreenTexts.membershipText", appSettings.lng)}
            </Text>
          </View>
          <AppButton
            title={__(
              "myMembershipScreenTexts.learnMoreButtontitle",
              appSettings.lng
            )}
            style={styles.button}
            textStyle={styles.buttonText}
            onPress={() => {
              Linking.openURL(
                __("myMembershipScreenTexts.membershipURL", appSettings.lng)
              );
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    paddingVertical: 6,
    borderRadius: 3,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
  },
  container: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    flex: 1,
  },
  mainWrap: {
    backgroundColor: COLORS.bg_dark,
    paddingHorizontal: "3%",
    paddingVertical: 25,
    width: "100%",
  },
  membershipText: {
    fontSize: 16,
    color: COLORS.text_gray,
    marginBottom: 5,
    textAlign: "justify",
    lineHeight: 22,
  },
  separator: {
    width: "100%",
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    color: COLORS.text_dark,
    paddingLeft: 10,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default MyMembershipScreen;
