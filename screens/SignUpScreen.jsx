/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";

// External Libraries
import { Formik } from "formik";
import * as Yup from "yup";

// Custom Components & Functions
import AppButton from "../components/AppButton";
import api from "../api/client";
import { COLORS } from "../variables/color";
import FlashNotification from "../components/FlashNotification";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";

const SignUpScreen = ({ navigation }) => {
  const [{ ios, appSettings }] = useStateValue();
  const [validationSchema, setValidationSchema] = useState(
    Yup.object().shape({
      first_name: Yup.string()
        .required()
        .label(
          __("signUpScreenTexts.formFieldLabels.first_name", appSettings.lng)
        ),
      last_name: Yup.string()
        .required()
        .label(
          __("signUpScreenTexts.formFieldLabels.last_name", appSettings.lng)
        ),
      username: Yup.string()
        .required()
        .min(6)
        .label(
          __("signUpScreenTexts.formFieldLabels.username", appSettings.lng)
        ),
      phone: Yup.number()
        .required()
        .min(5)
        .label(__("signUpScreenTexts.formFieldLabels.phone", appSettings.lng)),
      email: Yup.string()
        .required()
        .email()
        .label(__("signUpScreenTexts.formFieldLabels.email", appSettings.lng)),
      password: Yup.string()
        .required()
        .min(6)
        .label(
          __("signUpScreenTexts.formFieldLabels.password", appSettings.lng)
        ),
    })
  );
  const [responseErrorMessage, setResponseErrorMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();

  const handleSignup = (values) => {
    setResponseErrorMessage();
    setLoading((prevLoading) => true);
    Keyboard.dismiss();
    api.post("register", values).then((res) => {
      if (res.ok) {
        handleSuccess(
          __("signUpScreenTexts.signupSuccessMessage", appSettings.lng)
        );
      } else {
        if (res.problem === "TIMEOUT_ERROR") {
          setResponseErrorMessage(
            __("signUpScreenTexts.errorMessage.timeoutError", appSettings.lng)
          );
          handleError(
            __("signUpScreenTexts.errorMessage.timeoutError", appSettings.lng)
          );
        } else {
          setResponseErrorMessage(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("signUpScreenTexts.errorMessage.serverError", appSettings.lng)
          );
          handleError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("signUpScreenTexts.errorMessage.serverError", appSettings.lng)
          );
        }
      }
    });
  };

  const handleSuccess = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setLoading((prevLoading) => false);
      navigation.goBack();
    }, 800);
  };
  const handleError = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setLoading(false);
    }, 1000);
  };

  return ios ? (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1 }}
      keyboardVerticalOffset={80}
    >
      <ScrollView>
        <View style={[styles.container, { paddingBottom: 50 }]}>
          <View style={styles.signUpForm}>
            <Formik
              initialValues={{
                first_name: "",
                last_name: "",
                username: "",
                phone: "",
                email: "",
                password: "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSignup}
            >
              {({
                handleChange,
                handleSubmit,
                values,
                errors,
                setFieldTouched,
                touched,
              }) => (
                <View style={{ width: "100%", paddingHorizontal: "3%" }}>
                  <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1, marginRight: 5 }}>
                      <Text>
                        {__(
                          "signUpScreenTexts.formFieldLabels.first_name",
                          appSettings.lng
                        )}
                        <Text style={styles.required}> *</Text>
                      </Text>
                      <TextInput
                        style={[styles.inputCommon, styles.nameInput]}
                        onChangeText={handleChange("first_name")}
                        onBlur={() => setFieldTouched("first_name")}
                        value={values.first_name}
                        placeholder={__(
                          "signUpScreenTexts.formFieldPlaceholders.first_name",
                          appSettings.lng
                        )}
                      />
                      <View style={styles.errorWrap}>
                        {touched.first_name && errors.first_name && (
                          <Text style={styles.errorMessage}>
                            {errors.first_name}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={{ flex: 1, marginLeft: 5 }}>
                      <Text>
                        {__(
                          "signUpScreenTexts.formFieldLabels.last_name",
                          appSettings.lng
                        )}
                        <Text style={styles.required}> *</Text>
                      </Text>
                      <TextInput
                        style={[styles.inputCommon, styles.nameInput]}
                        onChangeText={handleChange("last_name")}
                        onBlur={() => setFieldTouched("last_name")}
                        value={values.last_name}
                        placeholder={__(
                          "signUpScreenTexts.formFieldPlaceholders.last_name",
                          appSettings.lng
                        )}
                      />
                      <View style={styles.errorWrap}>
                        {touched.last_name && errors.last_name && (
                          <Text style={styles.errorMessage}>
                            {errors.last_name}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <Text>
                    {__(
                      "signUpScreenTexts.formFieldLabels.username",
                      appSettings.lng
                    )}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <TextInput
                    style={[styles.inputCommon, styles.usernameInput]}
                    onChangeText={handleChange("username")}
                    onBlur={() => setFieldTouched("username")}
                    value={values.username}
                    placeholder={__(
                      "signUpScreenTexts.formFieldPlaceholders.username",
                      appSettings.lng
                    )}
                    autoCapitalize="none"
                  />
                  <View style={styles.errorWrap}>
                    {touched.username && errors.username && (
                      <Text style={styles.errorMessage}>{errors.username}</Text>
                    )}
                  </View>
                  <Text>
                    {__(
                      "signUpScreenTexts.formFieldLabels.email",
                      appSettings.lng
                    )}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <TextInput
                    style={[styles.inputCommon, styles.emailImput]}
                    onChangeText={handleChange("email")}
                    onBlur={() => setFieldTouched("email")}
                    value={values.email}
                    placeholder={__(
                      "signUpScreenTexts.formFieldPlaceholders.email",
                      appSettings.lng
                    )}
                    keyboardType="email-address"
                  />
                  <View style={styles.errorWrap}>
                    {touched.email && errors.email && (
                      <Text style={styles.errorMessage}>{errors.email}</Text>
                    )}
                  </View>
                  <Text>
                    {__(
                      "signUpScreenTexts.formFieldLabels.phone",
                      appSettings.lng
                    )}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <TextInput
                    style={[styles.inputCommon, styles.phoneImput]}
                    onChangeText={handleChange("phone")}
                    onBlur={() => setFieldTouched("phone")}
                    value={values.phone}
                    placeholder={__(
                      "signUpScreenTexts.formFieldPlaceholders.phone",
                      appSettings.lng
                    )}
                    keyboardType="phone-pad"
                  />
                  <View style={styles.errorWrap}>
                    {touched.phone && errors.phone && (
                      <Text style={styles.errorMessage}>{errors.phone}</Text>
                    )}
                  </View>

                  <Text>
                    {__(
                      "signUpScreenTexts.formFieldLabels.password",
                      appSettings.lng
                    )}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <TextInput
                    style={[styles.inputCommon, styles.passwordImput]}
                    onChangeText={handleChange("password")}
                    onBlur={() => setFieldTouched("password")}
                    value={values.password}
                    placeholder={__(
                      "signUpScreenTexts.formFieldPlaceholders.password",
                      appSettings.lng
                    )}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <View style={styles.errorWrap}>
                    {touched.password && errors.password && (
                      <Text style={styles.errorMessage}>{errors.password}</Text>
                    )}
                  </View>

                  <AppButton
                    onPress={handleSubmit}
                    title={__(
                      "signUpScreenTexts.signUpButtonTitle",
                      appSettings.lng
                    )}
                    style={styles.signUpBtn}
                    textStyle={styles.signUpBtnTxt}
                    disabled={
                      Object.keys(errors).length > 0 ||
                      Object.keys(touched).length === 0
                    }
                    loading={loading}
                  />
                  <View style={styles.responseErrorWrap}>
                    <Text style={styles.responseErrorMessage}>
                      {responseErrorMessage}
                    </Text>
                  </View>
                </View>
              )}
            </Formik>
          </View>

          <FlashNotification
            falshShow={flashNotification}
            flashMessage={flashNotificationMessage}
            containerStyle={styles.flashContainerStyle}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  ) : (
    <ScrollView>
      <View style={[styles.container, { paddingBottom: 0 }]}>
        <View style={styles.signUpForm}>
          <Formik
            initialValues={{
              first_name: "",
              last_name: "",
              username: "",
              phone: "",
              email: "",
              password: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSignup}
          >
            {({
              handleChange,
              handleSubmit,
              values,
              errors,
              setFieldTouched,
              touched,
            }) => (
              <View style={{ width: "100%", paddingHorizontal: "3%" }}>
                <View style={{ flexDirection: "row" }}>
                  <View style={{ flex: 1, marginRight: 5 }}>
                    <Text>
                      {__(
                        "signUpScreenTexts.formFieldLabels.first_name",
                        appSettings.lng
                      )}
                      <Text style={styles.required}> *</Text>
                    </Text>
                    <TextInput
                      style={[styles.inputCommon, styles.nameInput]}
                      onChangeText={handleChange("first_name")}
                      onBlur={() => setFieldTouched("first_name")}
                      value={values.first_name}
                      placeholder={__(
                        "signUpScreenTexts.formFieldPlaceholders.first_name",
                        appSettings.lng
                      )}
                    />
                    <View style={styles.errorWrap}>
                      {touched.first_name && errors.first_name && (
                        <Text style={styles.errorMessage}>
                          {errors.first_name}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text>
                      {__(
                        "signUpScreenTexts.formFieldLabels.last_name",
                        appSettings.lng
                      )}
                      <Text style={styles.required}> *</Text>
                    </Text>
                    <TextInput
                      style={[styles.inputCommon, styles.nameInput]}
                      onChangeText={handleChange("last_name")}
                      onBlur={() => setFieldTouched("last_name")}
                      value={values.last_name}
                      placeholder={__(
                        "signUpScreenTexts.formFieldPlaceholders.last_name",
                        appSettings.lng
                      )}
                    />
                    <View style={styles.errorWrap}>
                      {touched.last_name && errors.last_name && (
                        <Text style={styles.errorMessage}>
                          {errors.last_name}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <Text>
                  {__(
                    "signUpScreenTexts.formFieldLabels.username",
                    appSettings.lng
                  )}
                  <Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={[styles.inputCommon, styles.usernameInput]}
                  onChangeText={handleChange("username")}
                  onBlur={() => setFieldTouched("username")}
                  value={values.username}
                  placeholder={__(
                    "signUpScreenTexts.formFieldPlaceholders.username",
                    appSettings.lng
                  )}
                  autoCapitalize="none"
                />
                <View style={styles.errorWrap}>
                  {touched.username && errors.username && (
                    <Text style={styles.errorMessage}>{errors.username}</Text>
                  )}
                </View>
                <Text>
                  {__(
                    "signUpScreenTexts.formFieldLabels.email",
                    appSettings.lng
                  )}
                  <Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={[styles.inputCommon, styles.emailImput]}
                  onChangeText={handleChange("email")}
                  onBlur={() => setFieldTouched("email")}
                  value={values.email}
                  placeholder={__(
                    "signUpScreenTexts.formFieldPlaceholders.email",
                    appSettings.lng
                  )}
                  keyboardType="email-address"
                />
                <View style={styles.errorWrap}>
                  {touched.email && errors.email && (
                    <Text style={styles.errorMessage}>{errors.email}</Text>
                  )}
                </View>
                <Text>
                  {__(
                    "signUpScreenTexts.formFieldLabels.phone",
                    appSettings.lng
                  )}
                  <Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={[styles.inputCommon, styles.phoneImput]}
                  onChangeText={handleChange("phone")}
                  onBlur={() => setFieldTouched("phone")}
                  value={values.phone}
                  placeholder={__(
                    "signUpScreenTexts.formFieldPlaceholders.phone",
                    appSettings.lng
                  )}
                  keyboardType="phone-pad"
                />
                <View style={styles.errorWrap}>
                  {touched.phone && errors.phone && (
                    <Text style={styles.errorMessage}>{errors.phone}</Text>
                  )}
                </View>

                <Text>
                  {__(
                    "signUpScreenTexts.formFieldLabels.password",
                    appSettings.lng
                  )}
                  <Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={[styles.inputCommon, styles.passwordImput]}
                  onChangeText={handleChange("password")}
                  onBlur={() => setFieldTouched("password")}
                  value={values.password}
                  placeholder={__(
                    "signUpScreenTexts.formFieldPlaceholders.password",
                    appSettings.lng
                  )}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <View style={styles.errorWrap}>
                  {touched.password && errors.password && (
                    <Text style={styles.errorMessage}>{errors.password}</Text>
                  )}
                </View>

                <AppButton
                  onPress={handleSubmit}
                  title={__(
                    "signUpScreenTexts.signUpButtonTitle",
                    appSettings.lng
                  )}
                  style={styles.signUpBtn}
                  textStyle={styles.signUpBtnTxt}
                  disabled={
                    Object.keys(errors).length > 0 ||
                    Object.keys(touched).length === 0
                  }
                  loading={loading}
                />
                <View style={styles.responseErrorWrap}>
                  <Text style={styles.responseErrorMessage}>
                    {responseErrorMessage}
                  </Text>
                </View>
              </View>
            )}
          </Formik>
        </View>

        <FlashNotification
          falshShow={flashNotification}
          flashMessage={flashNotificationMessage}
          containerStyle={styles.flashContainerStyle}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
  },
  errorMessage: {
    color: COLORS.red,
    fontSize: 12,
  },
  errorWrap: {
    height: 20,
  },
  flashContainerStyle: {
    top: "85%",
    bottom: "5%",
  },
  signUpForm: {
    width: "100%",
    paddingTop: 10,
    marginBottom: 40,
  },
  inputCommon: {
    backgroundColor: "#e3e3e3",
    marginVertical: 10,
    justifyContent: "center",
    height: 38,
    borderRadius: 3,
    paddingHorizontal: 10,
  },
  label: {
    alignItems: "flex-start",
  },
  loginPrompt: {
    marginTop: 40,
  },
  required: {
    color: COLORS.red,
  },
  responseErrorWrap: {
    alignItems: "center",
  },
  responseErrorMessage: {
    color: COLORS.red,
    fontSize: 15,
    fontWeight: "bold",
  },
  signUpBtn: {
    height: 40,
    borderRadius: 3,
    marginVertical: 10,
    width: "100%",
  },
});

export default SignUpScreen;
