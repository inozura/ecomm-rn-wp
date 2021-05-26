/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import {
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";

// External Libraries
import { Formik } from "formik";
import * as Yup from "yup";

// Custom Components & Functions
import AppButton from "../components/AppButton";
import AppTextButton from "../components/AppTextButton";
import AppSeparator from "../components/AppSeparator";
import { useStateValue } from "../StateProvider";
import api from "../api/client";
import { COLORS } from "../variables/color";
import authStorage from "../app/auth/authStorage";
import FlashNotification from "../components/FlashNotification";
import { __ } from "../language/stringPicker";

const LoginScreen = ({ navigation }) => {
  const [{ ios, appSettings }, dispatch] = useStateValue();
  const [validationSchema, setValidationSchema] = useState(
    Yup.object().shape({
      username: Yup.string()
        .required()
        .min(1)
        .label(
          __("loginScreenTexts.formFieldsLabel.username", appSettings.lng)
        ),
      password: Yup.string()
        .required()
        .min(1)
        .label(
          __("loginScreenTexts.formFieldsLabel.password", appSettings.lng)
        ),
    })
  );
  const [validationSchema_reset, setValidationSchema_reset] = useState(
    Yup.object().shape({
      user_login: Yup.string()
        .required()
        .min(3)
        .label(__("loginScreenTexts.formFieldsLabel.reset", appSettings.lng)),
    })
  );
  const [responseErrorMessage, setResponseErrorMessage] = useState();
  const [passResetErrorMessage, setPassResetResponseErrorMessage] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reset_Loading, setReset_Loading] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();

  const handleLogin = (values) => {
    setResponseErrorMessage();
    setLoading(true);
    Keyboard.dismiss();
    api
      .post("login", {
        username: values.username,
        password: values.password,
      })
      .then((res) => {
        if (res.ok) {
          dispatch({
            type: "SET_AUTH_DATA",
            data: {
              user: res.data.user,
              auth_token: res.data.jwt_token,
            },
          });
          authStorage.storeUser(JSON.stringify(res.data));

          handleSuccess(
            __("loginScreenTexts.loginSuccessMessage", appSettings.lng)
          );
        } else {
          setResponseErrorMessage(
            (responseErrorMessage) =>
              res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("loginScreenTexts.customResponseError", appSettings.lng)
          );
          handleError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("loginScreenTexts.customResponseError", appSettings.lng)
          );
          // setLoading((prevLoading) => false);
        }
      });
  };
  const handleSuccess = (message) => {
    setFlashNotificationMessage((prevFlashNotificationMessage) => message);
    setTimeout(() => {
      setFlashNotification((prevFlashNotification) => true);
    }, 10);
    setTimeout(() => {
      setFlashNotification((prevFlashNotification) => false);
      setLoading((prevLoading) => false);
      setFlashNotificationMessage();
      navigation.goBack();
    }, 1000);
  };
  const handleError = (message) => {
    setFlashNotificationMessage((prevFlashNotificationMessage) => message);
    setTimeout(() => {
      setFlashNotification((prevFlashNotification) => true);
    }, 10);
    setTimeout(() => {
      setFlashNotification((prevFlashNotification) => false);
      setFlashNotificationMessage();
      setLoading((prevLoading) => false);
    }, 1000);
  };

  const handleResetSuccess = (message) => {
    setFlashNotificationMessage((prevFlashNotificationMessage) => message);
    setTimeout(() => {
      setFlashNotification((prevFlashNotification) => true);
    }, 10);
    setTimeout(() => {
      setFlashNotification((prevFlashNotification) => false);
    }, 2000);
  };

  const handlePassReset = (values) => {
    setPassResetResponseErrorMessage();
    setReset_Loading((reset_Loading) => true);
    Keyboard.dismiss();
    api
      .post("reset-password", {
        user_login: values.user_login,
      })
      .then((res) => {
        if (res.ok) {
          setReset_Loading((reset_Loading) => false);
          setModalVisible(false);
          handleResetSuccess(
            __("loginScreenTexts.resetSuccessMessage", appSettings.lng)
          );
        } else {
          setPassResetResponseErrorMessage(
            (passResetResponseErrorMessage) =>
              res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("loginScreenTexts.customResponseError", appSettings.lng)
          );
          setReset_Loading((reset_Loading) => false);
        }
      })
      .catch((error) => {
        alert("Error");
      });
  };
  return ios ? (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1 }}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 80 }]}
      >
        <Text style={styles.loginNotice}>
          {__("loginScreenTexts.loginTitle", appSettings.lng)}
        </Text>
        <View style={styles.loginForm}>
          <Formik
            initialValues={{ username: "", password: "" }}
            onSubmit={handleLogin}
            validationSchema={validationSchema}
          >
            {({
              handleChange,
              handleSubmit,
              values,
              errors,
              setFieldTouched,
              touched,
            }) => (
              <View style={{ width: "100%", alignItems: "center" }}>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    onChangeText={handleChange("username")}
                    onBlur={() => setFieldTouched("username")}
                    value={values.username}
                    placeholder={__(
                      "loginScreenTexts.formFieldsPlaceholder.username",
                      appSettings.lng
                    )}
                    autoCorrect={false}
                    onFocus={() => setFieldTouched("username")}
                    autoCapitalize="none"
                  />
                  <View style={styles.errorFieldWrap}>
                    {touched.username && errors.username && (
                      <Text style={styles.errorMessage}>{errors.username}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    onChangeText={handleChange("password")}
                    onBlur={() => setFieldTouched("password")}
                    value={values.password}
                    placeholder={__(
                      "loginScreenTexts.formFieldsPlaceholder.password",
                      appSettings.lng
                    )}
                    type="password"
                    autoCorrect={false}
                    autoCapitalize="none"
                    onFocus={() => setFieldTouched("password")}
                    secureTextEntry={true}
                  />
                  <View style={styles.errorFieldWrap}>
                    {touched.password && errors.password && (
                      <Text style={styles.errorMessage}>{errors.password}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.loginBtnWrap}>
                  <AppButton
                    onPress={handleSubmit}
                    title={__(
                      "loginScreenTexts.loginButtonTitle",
                      appSettings.lng
                    )}
                    style={styles.loginBtn}
                    textStyle={styles.loginBtnTxt}
                    disabled={
                      errors.username || errors.password || !touched.username
                    }
                    loading={loading}
                  />
                </View>
                {responseErrorMessage && (
                  <View style={styles.responseErrorWrap}>
                    <Text style={styles.responseErrorMessage}>
                      {responseErrorMessage}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Formik>
          <AppTextButton
            title={__("loginScreenTexts.forgotPassword", appSettings.lng)}
            style
            textStyle
            onPress={() => {
              setModalVisible(true);
            }}
          />
        </View>
        <AppSeparator />
        <View style={styles.signUpPrompt}>
          <Text style={styles.signUpPromptText}>
            {__("loginScreenTexts.signUpPrompt", appSettings.lng)}
          </Text>
          <AppTextButton
            title={__("loginScreenTexts.signUpButtonTitle", appSettings.lng)}
            style
            textStyle
            onPress={() => navigation.navigate("Sign Up")}
          />
        </View>
        <View style={styles.centeredView}>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>
                  {__("loginScreenTexts.forgotPassword", appSettings.lng)}
                </Text>
                <Text style={styles.modalText}>
                  {__("loginScreenTexts.passwordReset", appSettings.lng)}
                </Text>

                <Formik
                  initialValues={{ user_login: "" }}
                  validationSchema={validationSchema_reset}
                  onSubmit={handlePassReset}
                >
                  {({
                    handleChange,

                    handleSubmit,
                    values,
                    errors,
                    setFieldTouched,
                    touched,
                  }) => (
                    <View
                      style={{
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      <TextInput
                        style={styles.modalEmail}
                        onChangeText={handleChange("user_login")}
                        onBlur={() => setFieldTouched("user_login")}
                        value={values.user_login}
                        placeholder={__(
                          "loginScreenTexts.formFieldsPlaceholder.username",
                          appSettings.lng
                        )}
                        autoCorrect={false}
                        autoCapitalize="none"
                      />
                      <View style={styles.errorFieldWrap}>
                        {touched.user_login && errors.user_login && (
                          <Text style={styles.errorMessage}>
                            {errors.user_login}
                          </Text>
                        )}
                      </View>
                      <AppButton
                        title={__(
                          "loginScreenTexts.passwordResetButton",
                          appSettings.lng
                        )}
                        style={styles.resetLink}
                        onPress={handleSubmit}
                        loading={reset_Loading}
                        disabled={
                          errors.user_login || values.user_login.length < 1
                        }
                      />
                      {passResetErrorMessage && (
                        <View style={styles.responseErrorWrap}>
                          <Text style={styles.responseErrorMessage}>
                            {passResetErrorMessage}
                          </Text>
                        </View>
                      )}
                      <AppTextButton
                        title={__(
                          "loginScreenTexts.cancelButtonTitle",
                          appSettings.lng
                        )}
                        onPress={() => {
                          setModalVisible(!modalVisible);
                        }}
                        textStyle={styles.cancelResetBtn}
                      />
                    </View>
                  )}
                </Formik>
              </View>
            </View>
          </Modal>
        </View>
        <FlashNotification
          falshShow={flashNotification}
          flashMessage={flashNotificationMessage}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  ) : (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.loginNotice}>
        {__("loginScreenTexts.loginTitle", appSettings.lng)}
      </Text>
      <View style={styles.loginForm}>
        <Formik
          initialValues={{ username: "", password: "" }}
          onSubmit={handleLogin}
          validationSchema={validationSchema}
        >
          {({
            handleChange,
            handleSubmit,
            values,
            errors,
            setFieldTouched,
            touched,
          }) => (
            <View style={{ width: "100%", alignItems: "center" }}>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  onChangeText={handleChange("username")}
                  onBlur={() => setFieldTouched("username")}
                  value={values.username}
                  placeholder={__(
                    "loginScreenTexts.formFieldsPlaceholder.username",
                    appSettings.lng
                  )}
                  autoCorrect={false}
                  onFocus={() => setFieldTouched("username")}
                />
                <View style={styles.errorFieldWrap}>
                  {touched.username && errors.username && (
                    <Text style={styles.errorMessage}>{errors.username}</Text>
                  )}
                </View>
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  onChangeText={handleChange("password")}
                  onBlur={() => setFieldTouched("password")}
                  value={values.password}
                  placeholder={__(
                    "loginScreenTexts.formFieldsPlaceholder.password",
                    appSettings.lng
                  )}
                  type="password"
                  autoCorrect={false}
                  autoCapitalize="none"
                  onFocus={() => setFieldTouched("password")}
                  secureTextEntry={true}
                />
                <View style={styles.errorFieldWrap}>
                  {touched.password && errors.password && (
                    <Text style={styles.errorMessage}>{errors.password}</Text>
                  )}
                </View>
              </View>
              <View style={styles.loginBtnWrap}>
                <AppButton
                  onPress={handleSubmit}
                  title={__(
                    "loginScreenTexts.loginButtonTitle",
                    appSettings.lng
                  )}
                  style={styles.loginBtn}
                  textStyle={styles.loginBtnTxt}
                  disabled={
                    errors.username || errors.password || !touched.username
                  }
                  loading={loading}
                />
              </View>
              {responseErrorMessage && (
                <View style={styles.responseErrorWrap}>
                  <Text style={styles.responseErrorMessage}>
                    {responseErrorMessage}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Formik>
        <AppTextButton
          title={__("loginScreenTexts.forgotPassword", appSettings.lng)}
          style
          textStyle
          onPress={() => {
            setModalVisible(true);
          }}
        />
      </View>
      <AppSeparator />
      <View style={styles.signUpPrompt}>
        <Text style={styles.signUpPromptText}>
          {__("loginScreenTexts.signUpPrompt", appSettings.lng)}
        </Text>
        <AppTextButton
          title={__("loginScreenTexts.signUpButtonTitle", appSettings.lng)}
          style
          textStyle
          onPress={() => navigation.navigate("Sign Up")}
        />
      </View>
      <View style={styles.centeredView}>
        <Modal animationType="slide" transparent={true} visible={modalVisible}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>
                {__("loginScreenTexts.forgotPassword", appSettings.lng)}
              </Text>
              <Text style={styles.modalText}>
                {__("loginScreenTexts.passwordReset", appSettings.lng)}
              </Text>

              <Formik
                initialValues={{ user_login: "" }}
                validationSchema={validationSchema_reset}
                onSubmit={handlePassReset}
              >
                {({
                  handleChange,

                  handleSubmit,
                  values,
                  errors,
                  setFieldTouched,
                  touched,
                }) => (
                  <View
                    style={{
                      width: "100%",
                      alignItems: "center",
                    }}
                  >
                    <TextInput
                      style={styles.modalEmail}
                      onChangeText={handleChange("user_login")}
                      onBlur={() => setFieldTouched("user_login")}
                      value={values.user_login}
                      placeholder={__(
                        "loginScreenTexts.formFieldsPlaceholder.username",
                        appSettings.lng
                      )}
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                    <View style={styles.errorFieldWrap}>
                      {touched.user_login && errors.user_login && (
                        <Text style={styles.errorMessage}>
                          {errors.user_login}
                        </Text>
                      )}
                    </View>
                    <AppButton
                      title={__(
                        "loginScreenTexts.passwordResetButton",
                        appSettings.lng
                      )}
                      style={styles.resetLink}
                      onPress={handleSubmit}
                      loading={reset_Loading}
                      disabled={
                        errors.user_login || values.user_login.length < 1
                      }
                    />
                    {passResetErrorMessage && (
                      <View style={styles.responseErrorWrap}>
                        <Text style={styles.responseErrorMessage}>
                          {passResetErrorMessage}
                        </Text>
                      </View>
                    )}
                    <AppTextButton
                      title={__(
                        "loginScreenTexts.cancelButtonTitle",
                        appSettings.lng
                      )}
                      onPress={() => {
                        setModalVisible(!modalVisible);
                      }}
                      textStyle={styles.cancelResetBtn}
                    />
                  </View>
                )}
              </Formik>
            </View>
          </View>
        </Modal>
      </View>
      <FlashNotification
        falshShow={flashNotification}
        flashMessage={flashNotificationMessage}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  cancelResetBtn: {
    color: "gray",
  },
  container: {
    alignItems: "center",
    paddingTop: 10,
  },
  errorFieldWrap: {
    height: 15,
    justifyContent: "center",
  },
  errorMessage: {
    fontSize: 12,
    color: COLORS.red,
  },
  inputWrap: {
    width: "100%",
    alignItems: "center",
  },
  loginBtn: {
    height: 40,
    borderRadius: 3,
    marginVertical: 10,
  },
  loginBtnWrap: {
    width: "100%",
    paddingHorizontal: "3%",
  },
  loginForm: {
    width: "100%",
    marginBottom: 40,
  },
  loginNotice: {
    fontSize: 16,
    color: "#111",
    marginVertical: 20,
  },
  modalEmail: {
    backgroundColor: "#e3e3e3",
    width: "95%",
    marginVertical: 10,
    height: 38,
    justifyContent: "center",
    borderRadius: 3,
    paddingHorizontal: 10,
  },
  input: {
    backgroundColor: "#e3e3e3",
    width: "95%",
    marginVertical: 10,
    height: 38,
    justifyContent: "center",
    borderRadius: 3,
    paddingHorizontal: 10,
  },
  resetLink: {
    height: 40,
    borderRadius: 3,
    marginVertical: 10,
  },
  responseErrorMessage: {
    color: COLORS.red,
    fontWeight: "bold",
    fontSize: 15,
  },
  responseErrorWrap: {
    marginVertical: 10,
    alignItems: "center",
  },
  signUpPrompt: {
    marginTop: 40,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 3,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "90%",
  },

  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
});

export default LoginScreen;
