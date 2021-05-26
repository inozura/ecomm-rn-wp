/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";

// External Libraries
import { Formik } from "formik";
import * as Yup from "yup";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import AppButton from "../components/AppButton";
import AppSeparator from "../components/AppSeparator";
import { useStateValue } from "../StateProvider";
import api from "../api/client";
import FlashNotification from "../components/FlashNotification";
import { __ } from "../language/stringPicker";

const ContactUsScreen = ({ navigation }) => {
  const [{ user, ios, appSettings }] = useStateValue();
  const [validationSchema, setValidationSchema] = useState(
    Yup.object().shape({
      name: Yup.string()
        .required()
        .min(3)
        .label(
          __("contactUsScreenTexts.formData.name.errorLabel", appSettings.lng)
        ),
      phone: Yup.string()
        .min(5)
        .label(
          __("contactUsScreenTexts.formData.phone.errorLabel", appSettings.lng)
        ),
      email: Yup.string()
        .email()
        .required()
        .label(
          __("contactUsScreenTexts.formData.email.errorLabel", appSettings.lng)
        ),
      message: Yup.string()
        .required()
        .min(3)
        .label(
          __(
            "contactUsScreenTexts.formData.message.errorLabel",
            appSettings.lng
          )
        ),
    })
  );
  const [formErrorMessage, setFormErrorMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();

  const handleMessageSubmission = (values) => {
    setFormErrorMessage();
    setLoading((loading) => true);
    Keyboard.dismiss();

    api
      .post("contact", {
        name: values.name,
        phone: values.phone,
        email: values.email,
        message: values.message,
      })
      .then((res) => {
        if (res.ok) {
          setFlashNotificationMessage(
            __("contactUsScreenTexts.successMessage", appSettings.lng)
          );
          handleSuccess();
          // setLoading((loading) => false);
          // navigation.goBack();
        } else {
          setFormErrorMessage(
            (formErrorMessage) =>
              res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __(
                "contactUsScreenTexts.customServerResponseError",
                appSettings.lng
              )
          );
          setFlashNotificationMessage(
            (prevFlashNotificationMessage) =>
              res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __(
                "contactUsScreenTexts.customServerResponseError",
                appSettings.lng
              )
          );
          // setLoading((loading) => false);
          handleError();
        }
      });
  };

  const handleSuccess = () => {
    setFlashNotification((prevFlashNotification) => true);

    setTimeout(() => {
      setFlashNotification((prevFlashNotification) => false);
      setLoading((prevLoading) => false);
      navigation.goBack();
    }, 1000);
  };
  const handleError = () => {
    setFlashNotification((prevFlashNotification) => true);

    setTimeout(() => {
      setFlashNotification((prevFlashNotification) => false);
      setLoading((prevLoading) => false);
    }, 1000);
  };

  return ios ? (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1 }}
      keyboardVerticalOffset={70}
    >
      <ScrollView>
        <View style={[styles.container, { paddingBottom: 50 }]}>
          {/* Form Component */}
          <Formik
            initialValues={{
              name: user
                ? !!user.first_name || !!user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : ""
                : "",
              phone: user?.phone || "",
              email: user?.email || "",
              message: "",
            }}
            onSubmit={handleMessageSubmission}
            validationSchema={validationSchema}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              setFieldTouched,
              touched,
            }) => (
              <View>
                {/* Name Input Component */}
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>
                    {__(
                      "contactUsScreenTexts.formData.name.label",
                      appSettings.lng
                    )}
                    {` `}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    onChangeText={handleChange("name")}
                    onBlur={() => setFieldTouched("name")}
                    value={values.name}
                    placeholder={__(
                      "contactUsScreenTexts.formData.name.placeholder",
                      appSettings.lng
                    )}
                    editable={
                      user === null || (!user.first_name && !user.last_name)
                    }
                  />
                  <AppSeparator style={styles.separator} />
                  <View style={styles.inputErrorWrap}>
                    {touched.name && errors.name && (
                      <Text style={styles.inputErrorMessage}>
                        {errors.name}
                      </Text>
                    )}
                  </View>
                </View>
                {/* Phone Input Component */}
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>
                    {__(
                      "contactUsScreenTexts.formData.phone.label",
                      appSettings.lng
                    )}
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    onChangeText={handleChange("phone")}
                    onBlur={() => setFieldTouched("phone")}
                    value={values.phone}
                    placeholder={__(
                      "contactUsScreenTexts.formData.phone.placeholder",
                      appSettings.lng
                    )}
                    editable={user === null || !user.phone}
                    keyboardType="phone-pad"
                  />
                  <AppSeparator style={styles.separator} />
                  <View style={styles.inputErrorWrap}>
                    {touched.phone && errors.phone && (
                      <Text style={styles.inputErrorMessage}>
                        {errors.phone}
                      </Text>
                    )}
                  </View>
                </View>
                {/* Email Input Component */}
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>
                    {__(
                      "contactUsScreenTexts.formData.email.label",
                      appSettings.lng
                    )}
                    {` `}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    onChangeText={handleChange("email")}
                    onBlur={() => setFieldTouched("email")}
                    value={values.email}
                    placeholder={__(
                      "contactUsScreenTexts.formData.email.placeholder",
                      appSettings.lng
                    )}
                    editable={user === null || !user.email}
                    keyboardType="email-address"
                  />
                  <AppSeparator style={styles.separator} />
                  <View style={styles.inputErrorWrap}>
                    {touched.email && errors.email && (
                      <Text style={styles.inputErrorMessage}>
                        {errors.email}
                      </Text>
                    )}
                  </View>
                </View>
                {/* Message Input Component */}
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>
                    {__(
                      "contactUsScreenTexts.formData.message.label",
                      appSettings.lng
                    )}
                    {` `}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <TextInput
                    style={[styles.formInput, { minHeight: 100 }]}
                    onChangeText={handleChange("message")}
                    onBlur={() => setFieldTouched("message")}
                    value={values.message}
                    placeholder={__(
                      "contactUsScreenTexts.formData.message.placeholder",
                      appSettings.lng
                    )}
                    multiline={true}
                    blurOnSubmit={false}
                  />

                  <AppSeparator style={styles.separator} />
                  <View style={styles.inputErrorWrap}>
                    {touched.message && errors.message && (
                      <Text style={styles.inputErrorMessage}>
                        {errors.message}
                      </Text>
                    )}
                  </View>
                </View>
                {/* Send Message Button Component */}
                <AppButton
                  onPress={handleSubmit}
                  title={__(
                    "contactUsScreenTexts.sendmessageButtontitle",
                    appSettings.lng
                  )}
                  style={styles.button}
                  textStyle={styles.buttonText}
                  disabled={
                    user
                      ? Object.keys(errors).length > 0 ||
                        !values.message ||
                        !values.name ||
                        !values.email
                      : Object.keys(errors).length > 0 ||
                        Object.keys(touched).length < 1
                  }
                  loading={loading}
                />
                <View style={styles.formErrorWrap}>
                  {formErrorMessage && (
                    <Text style={styles.formErrorMessage}>
                      {formErrorMessage}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>
      {/* Flash Notification Component */}
      <FlashNotification
        falshShow={flashNotification}
        flashMessage={flashNotificationMessage}
      />
    </KeyboardAvoidingView>
  ) : (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Form Component */}
        <Formik
          initialValues={{
            name: user
              ? !!user.first_name || !!user.last_name
                ? `${user.first_name} ${user.last_name}`
                : ""
              : "",
            phone: user?.phone || "",
            email: user?.email || "",
            message: "",
          }}
          onSubmit={handleMessageSubmission}
          validationSchema={validationSchema}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            setFieldTouched,
            touched,
          }) => (
            <View>
              {/* Name Input Component */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>
                  {__(
                    "contactUsScreenTexts.formData.name.label",
                    appSettings.lng
                  )}
                  {` `}
                  <Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  onChangeText={handleChange("name")}
                  onBlur={() => setFieldTouched("name")}
                  value={values.name}
                  placeholder={__(
                    "contactUsScreenTexts.formData.name.placeholder",
                    appSettings.lng
                  )}
                  editable={
                    user === null || (!user.first_name && !user.last_name)
                  }
                />
                <AppSeparator style={styles.separator} />
                <View style={styles.inputErrorWrap}>
                  {touched.name && errors.name && (
                    <Text style={styles.inputErrorMessage}>{errors.name}</Text>
                  )}
                </View>
              </View>
              {/* Phone Input Component */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>
                  {__(
                    "contactUsScreenTexts.formData.phone.label",
                    appSettings.lng
                  )}
                </Text>
                <TextInput
                  style={styles.formInput}
                  onChangeText={handleChange("phone")}
                  onBlur={() => setFieldTouched("phone")}
                  value={values.phone}
                  placeholder={__(
                    "contactUsScreenTexts.formData.phone.placeholder",
                    appSettings.lng
                  )}
                  editable={user === null || !user.phone}
                  keyboardType="phone-pad"
                />
                <AppSeparator style={styles.separator} />
                <View style={styles.inputErrorWrap}>
                  {touched.phone && errors.phone && (
                    <Text style={styles.inputErrorMessage}>{errors.phone}</Text>
                  )}
                </View>
              </View>
              {/* Email Input Component */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>
                  {__(
                    "contactUsScreenTexts.formData.email.label",
                    appSettings.lng
                  )}
                  {` `}
                  <Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  onChangeText={handleChange("email")}
                  onBlur={() => setFieldTouched("email")}
                  value={values.email}
                  placeholder={__(
                    "contactUsScreenTexts.formData.email.placeholder",
                    appSettings.lng
                  )}
                  editable={user === null || !user.email}
                  keyboardType="email-address"
                />
                <AppSeparator style={styles.separator} />
                <View style={styles.inputErrorWrap}>
                  {touched.email && errors.email && (
                    <Text style={styles.inputErrorMessage}>{errors.email}</Text>
                  )}
                </View>
              </View>
              {/* Message Input Component */}
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>
                  {__(
                    "contactUsScreenTexts.formData.message.label",
                    appSettings.lng
                  )}
                  {` `}
                  <Text style={styles.required}> *</Text>
                </Text>
                <TextInput
                  style={[styles.formInput, { minHeight: 100 }]}
                  onChangeText={handleChange("message")}
                  onBlur={() => setFieldTouched("message")}
                  value={values.message}
                  placeholder={__(
                    "contactUsScreenTexts.formData.message.placeholder",
                    appSettings.lng
                  )}
                  multiline={true}
                  blurOnSubmit={false}
                />
                <AppSeparator style={styles.separator} />
                <View style={styles.inputErrorWrap}>
                  {touched.message && errors.message && (
                    <Text style={styles.inputErrorMessage}>
                      {errors.message}
                    </Text>
                  )}
                </View>
              </View>
              {/* Send Message Button Component */}
              <AppButton
                onPress={handleSubmit}
                title={__(
                  "contactUsScreenTexts.sendmessageButtontitle",
                  appSettings.lng
                )}
                style={styles.button}
                textStyle={styles.buttonText}
                disabled={
                  user
                    ? Object.keys(errors).length > 0 ||
                      !values.message ||
                      !values.name ||
                      !values.email
                    : Object.keys(errors).length > 0 ||
                      Object.keys(touched).length < 1
                }
                loading={loading}
              />
              <View style={styles.formErrorWrap}>
                {formErrorMessage && (
                  <Text style={styles.formErrorMessage}>
                    {formErrorMessage}
                  </Text>
                )}
              </View>
            </View>
          )}
        </Formik>
      </View>
      {/* Flash Notification Component */}
      <FlashNotification
        falshShow={flashNotification}
        flashMessage={flashNotificationMessage}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 3,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
  },
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: "3%",
    paddingTop: 20,
    width: "100%",

    flex: 1,
  },
  scrollContainer: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  formErrorMessage: {
    fontSize: 15,
    color: COLORS.red,
    fontWeight: "bold",
  },
  formErrorWrap: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  formInput: {
    color: COLORS.text_dark,
    fontSize: 16,
    minHeight: 32,
  },

  inputErrorWrap: {
    minHeight: 20,
  },
  inputErrorMessage: {
    fontSize: 12,
    color: COLORS.red,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.text_gray,
  },

  pageTitle: {
    fontSize: 20,
    color: COLORS.text_dark,
  },
  required: {
    color: COLORS.red,
  },
  separator: {
    width: "100%",
    backgroundColor: COLORS.gray,
  },
});

export default ContactUsScreen;
