/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Image,
} from "react-native";

// Expo Libraries
import * as Location from "expo-location";

// External Libraries
import * as Progress from "react-native-progress";
import { Formik } from "formik";
import * as Yup from "yup";
import moment from "moment";
import MapView, { Marker } from "react-native-maps";
import Geocoder from "react-native-geocoding";
import { GooglePlacesAutocomplete } from "../components/map/GooglePlacesAutocomplete";
import { debounce } from "lodash";

// Vector Icons
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";

// Custom Components & Constants
import AppSeparator from "../components/AppSeparator";
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";
import AppButton from "../components/AppButton";
import DynamicListPicker from "../components/DynamicListPicker";
import ImageInputList from "../components/ImageInputList";
import api, {
  setAuthToken,
  setMultipartHeader,
  removeMultipartHeader,
  removeAuthToken,
} from "../api/client";
import DynamicRadioButton from "../components/DynamicRadioButton";
import DynamicCheckbox from "../components/DynamicCheckbox";
import DatePicker from "../components/DatePicker";
import DateRangePicker from "../components/DateRangePicker";
import { getCurrencySymbol, decodeString } from "../helper/helper";
import UploadingIndicator from "../components/UploadingIndicator";
import DoneIndicator from "../components/DoneIndicator";
import ErrorIndicator from "../components/ErrorIndicator";
import AppRadioButton from "../components/AppRadioButton";
import { __ } from "../language/stringPicker";

const { width: screenWidth } = Dimensions.get("screen");

const EditListingScreen = ({ route, navigation }) => {
  const [{ auth_token, user, config, ios, appSettings }] = useStateValue();
  const [validationSchema, setValidationSchema] = useState(
    Yup.object().shape({
      name: Yup.string()
        .required()
        .label(
          __("editListingScreenTexts.formFieldLabels.name", appSettings.lng)
        ),
      zipcode: Yup.string()
        .min(3)
        .label(
          __("editListingScreenTexts.formFieldLabels.zipCode", appSettings.lng)
        ),
      website: Yup.string()
        .matches(
          /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
          __("editListingScreenTexts.websiteErrorLabel", appSettings.lng)
        )
        .label(
          __("editListingScreenTexts.formFieldLabels.website", appSettings.lng)
        ),
      address: Yup.string().label(
        __("editListingScreenTexts.formFieldLabels.address", appSettings.lng)
      ),
      email: Yup.string()
        .required()
        .email()
        .label(
          __("editListingScreenTexts.formFieldLabels.email", appSettings.lng)
        ),
      phone: Yup.string()
        .required()
        .min(5)
        .label(
          __("editListingScreenTexts.formFieldLabels.phone", appSettings.lng)
        ),
      whatsapp_number: Yup.string()
        .min(5)
        .label(
          __("editListingScreenTexts.formFieldLabels.whatsapp", appSettings.lng)
        ),
      title: Yup.string()
        .required()
        .label(
          __(
            "editListingScreenTexts.formFieldLabels.listingTitle",
            appSettings.lng
          )
        ),
      video_urls: Yup.string().matches(
        "(https?://)(www.)?(youtube.com/watch[?]v=([a-zA-Z0-9_-]{11}))",
        __("editListingScreenTexts.videoUrlErrorLabel", appSettings.lng)
      ),
    })
  );
  const [loading, setLoading] = useState(true);
  const [validateCfDependency, setValidateCfDependency] = useState([]);
  const [listingData, setListingData] = useState();
  const [imageUris, setImageUris] = useState([]);
  const [imageObjects, setImageObjects] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [sortedImages, setSortedImages] = useState([]);
  const [listingCommonData, setListingCommonData] = useState({});
  const [listingCustomData, setListingCustomData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [customRequiredFields, setCustomRequiredFields] = useState([]);
  const [commonRequiredFields, setCommonRequiredFields] = useState([
    "pricing_type",
    "price_type",
  ]);
  const [touchedFields, setTouchedFields] = useState([]);
  const [customErrorFields, setCustomErrorFields] = useState([]);
  const [commonErrorFields, setCommonErrorFields] = useState([]);
  const [existingImageObjects, setExistingImageObjects] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState();
  const [error, setError] = useState();
  const [hasImage, setHasImage] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapType, setMapType] = useState("standard");
  const [region, setRegion] = useState();
  const [markerPosition, setMarkerPosition] = useState();
  const [listingGeoAddress, setListingGeoAddress] = useState("");
  const [hideMap, setHideMap] = useState(false);
  const [geoCoderFail, setGeoCoderFail] = useState(false);
  const [geoCoderFailedMessage, setGeoCoderFailedMessage] = useState(false);
  const [galleryTouched, setGalleryTouched] = useState(false);
  const [galleryError, setGalleryError] = useState(false);

  const mapViewRef = useRef();

  const isNumeric = (n) => {
    return n !== "" && !isNaN(parseFloat(n)) && isFinite(n);
  };

  const isEqualToNumber = (v1, v2) => {
    return parseFloat(v1) === parseFloat(v2);
  };

  const isEqualTo = (v1, v2) => {
    return parseString(v1).toLowerCase() === parseString(v2).toLowerCase();
  };

  const containsString = (haystack, needle) => {
    return parseString(haystack).indexOf(parseString(needle)) > -1;
  };
  const matchesPattern = (v1, pattern) => {
    const regexp = new RegExp(parseString(pattern), "gi");
    return parseString(v1).match(regexp);
  };

  const parseString = (str) => {
    return str ? "" + str : "";
  };

  const cfValidated = (rule, cfs) => {
    let isValid = 0;
    const field_id = rule.field;

    const operator = rule.operator;
    const dependFieldArray = cfs ? cfs.filter((_) => _.id == field_id) : [];
    let dependField = dependFieldArray.length ? dependFieldArray[0] : "";
    if (dependField) {
      const dependentFieldValue = listingCustomData["_field_" + field_id] || ""; //TODO

      // Check if filed is exist at custom field object
      if (operator === "==empty") {
        // hasNoValue
        isValid = Array.isArray(dependentFieldValue)
          ? !dependentFieldValue.length
          : !dependentFieldValue;
      } else if (operator === "!=empty") {
        // hasValue  -- ANY value
        isValid = Array.isArray(dependentFieldValue)
          ? !!dependentFieldValue.length
          : !!dependentFieldValue;
      } else if (operator === "==") {
        // equalTo
        if (isNumeric(rule.value)) {
          return isEqualToNumber(rule.value, dependentFieldValue);
        } else {
          return isEqualTo(rule.value, dependentFieldValue);
        }
      } else if (operator === "!=") {
        // notEqualTo
        if (isNumeric(rule.value)) {
          return !isEqualToNumber(rule.value, dependentFieldValue);
        } else {
          return !isEqualTo(rule.value, dependentFieldValue);
        }
      } else if (operator === "==pattern") {
        // patternMatch
        return matchesPattern(dependentFieldValue, rule.value);
      } else if (operator === "==contains") {
        // contains
        return containsString(dependentFieldValue, rule.value);
      }
    }
    isValid = isValid === 0 || isValid === 1 ? !!isValid : isValid;
    return isValid;
  };

  const cfDependencyValidateor = (field, cfs) => {
    if (!field.dependency) {
      return true;
    }
    const con = [];
    field.dependency.map((rules) => {
      const conInner = [];
      rules.map((rule) => {
        conInner.push(cfValidated(rule, cfs));
      });
      con.push(conInner);
    });
    if (con.map((item) => !item.includes(false)).includes(true)) {
      return true;
    }
    return false;
  };

  const initialCFDependencyCheck = (cfs) => {
    const tempCfFieldIds = [];
    if (cfs.length) {
      cfs.map((_cf) => {
        if (cfDependencyValidateor(_cf, cfs)) {
          tempCfFieldIds.push(_cf.id);
        }
        // else {
        //   const tempListingData = { ...listingData };
        //   tempListingData["_field_" + _cf.id] = null;
        //   setListingData(tempListingData);
        // }
      });
    }

    setValidateCfDependency(tempCfFieldIds);
  };

  useEffect(() => {
    if (!listingData) return;
    initialCFDependencyCheck(listingData.custom_fields);
  }, [listingCustomData]);

  //get initial form data call
  useEffect(() => {
    setAuthToken(auth_token);
    api
      .get("/listing/form", { listing_id: route.params.item.listing_id })
      .then((res) => {
        console.log(res.data.listing.pricing_type);
        console.log(res.data.config);
        if (res.ok) {
          setListingData((listingData) => res.data);

          if (res.data.custom_fields.length) {
            const required = res.data.custom_fields.filter(
              (field) => field.required
            );
            setCustomRequiredFields(required);
          }
          if (res.data.listing.images.length) {
            const existingImages = res.data.listing.images
              .map((image) => image.sizes.thumbnail.src)
              .reverse();

            const existingImgObjects = res.data.listing.images.map((image) => {
              return {
                uri: image.sizes.thumbnail.src,
                id: image.ID,
              };
            });
            setImageUris(existingImages);
            setExistingImageObjects(existingImgObjects);
          } else {
            if (res?.data?.config?.gallery?.image_required) {
              setCommonErrorFields((prevCommonErrorFields) => [
                ...prevCommonErrorFields,
                "gallery",
              ]);
            }
          }
          if (res?.data?.config?.gallery?.image_required) {
            setCommonRequiredFields((prevCommonRequiredFields) => [
              ...prevCommonRequiredFields,
              "gallery",
            ]);
          }
          const customData = {};
          res.data.custom_fields.map((_field) => {
            if (_field.type === "date") {
              if (["date", "date_time"].includes(_field.date.type)) {
                customData[_field.meta_key] = _field.value;
              } else {
                customData[_field.meta_key] = [
                  _field.value.start,
                  _field.value.end,
                ];
              }
            } else {
              customData[_field.meta_key] = _field.value;
            }
          });
          setListingCustomData(customData);
          const commonData = {};
          commonData["pricing_type"] =
            res?.data?.listing?.pricing_type || "price";
          commonData["price_type"] = res?.data?.listing?.price_type;
          commonData["price"] = res?.data?.listing?.price || "";
          if (res?.data?.listing?.pricing_type === "range") {
            commonData["max_price"] = res?.data?.listing?.max_price || "";
          }
          // commonData["video_url"] = res.data.listing.video_url || "";
          setListingCommonData(commonData);

          initialCFDependencyCheck(res.data.custom_fields);

          if (
            config.location_type === "google" &&
            res?.data?.listing?.contact?.geo_address
          ) {
            setListingGeoAddress(
              decodeString(res.data.listing.contact.geo_address)
            );
          }
          if (
            parseFloat(res.data.listing.contact.latitude) &&
            parseFloat(res.data.listing.contact.longitude)
          ) {
            const coordinates = {
              latitude: parseFloat(res.data.listing.contact.latitude) || 0,
              longitude: parseFloat(res.data.listing.contact.longitude) || 0,
            };
            setRegion(coordinates);
            setMarkerPosition(coordinates);
            if (config?.map?.api_key) {
              Geocoder.init(config.map.api_key);
            }
          } else {
            setGeoCoderFail(true);
            if (config?.map?.api_key) {
              Geocoder.init(config.map.api_key);
            }
          }
          removeAuthToken();
          setLoading(false);
        } else {
          // print error
          setLoading(false);
          removeAuthToken();
        }
      });
  }, []);

  // custom field error validation
  useEffect(() => {
    if (loading) return;
    customFieldErrorValidation();
  }, [listingCustomData, validateCfDependency]);

  // common field error validation
  useEffect(() => {
    if (loading) return;
    commonFieldErrorValidation();
  }, [listingCommonData, commonRequiredFields, imageUris]);

  const customFieldErrorValidation = () => {
    const requiredCF = listingData.custom_fields.filter(
      (field) => field.required && validateCfDependency.includes(field.id)
    );

    if (!requiredCF.length) {
      setCustomErrorFields([]);
      return;
    }

    const customErr = requiredCF.filter((field) => {
      if (field.type === "checkbox") {
        return listingCustomData[field.meta_key].length < 1;
      } else {
        return !listingCustomData[field.meta_key];
      }
    });
    setCustomErrorFields(customErr);
  };

  const handleAddImage = (uri) => {
    setImageUris([uri, ...imageUris]);
    let localUri = uri;
    let filename = localUri.split("/").pop();
    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;
    const image = {
      uri: localUri,
      name: filename,
      type,
    };
    setImageObjects([image, ...imageObjects].reverse());
  };
  const handleRemoveImage = (uri) => {
    setImageUris(imageUris.filter((imageUri) => imageUri !== uri));
    setImageObjects((imageObjects) => [
      ...imageObjects.filter((item) => item.uri !== uri),
    ]);

    const deletedImgId = existingImageObjects.filter(
      (imgObj) => imgObj.uri === uri
    );
    if (deletedImgId.length) {
      setDeletedImageIds((prevDeletedImageIds) => [
        ...prevDeletedImageIds,
        deletedImgId[0].id,
      ]);
    }
    setTouchedFields((prevtouchedFields) =>
      Array.from(new Set([...prevtouchedFields, "gallery"]))
    );
  };
  const handleTextData = (key, value) => {
    const tempData = { ...listingCustomData, [key]: value };
    setListingCustomData((listingCustomData) => tempData);
  };

  const testLogProgressValue = (value) => {
    setUploadProgress(value.loaded / value.total);
  };

  // Update Listing
  const handleUpdateListing = (values) => {
    setSubmitting(true);
    setUpdateLoading(true);

    const tempCFData = { ...listingCustomData };
    Object.keys(listingCustomData).map((_key) => {
      if (
        !validateCfDependency.includes(
          parseInt(_key.replace("_field_", ""), 10)
        )
      ) {
        delete tempCFData[_key];
      }
    });
    const tempValues = { ...values };
    delete tempValues["video_urls"];
    tempValues["video_urls"] = [values.video_urls];

    const data = {
      ["custom_fields"]: tempCFData,
      ...listingCommonData,
      // ...values,
      ...tempValues,
      ["category_id"]: listingData.listing.categories[0].term_id,
      ["agree"]: 1,
      ["gallery"]: imageObjects,
      ["listing_id"]: listingData.listing.listing_id,
      ["gallery_delete"]: deletedImageIds,
      ["gallery_sort"]: sortedImages,
      ...markerPosition,
    };
    if (config.location_type === "google" && listingGeoAddress) {
      data["geo_address"] = listingGeoAddress;
    }

    setAuthToken(auth_token);
    if (data.gallery.length) {
      setHasImage(true);
      const formData = new FormData();
      Object.keys(data).map((key) => {
        if (key === "custom_fields") {
          Object.keys(data[key]).map((innerKey) => {
            if (Array.isArray(data[key][innerKey])) {
              data[key][innerKey].map((_innerItem) => {
                formData.append(
                  "custom_fields[" + innerKey + "][]",
                  _innerItem
                );
              });
            } else {
              formData.append(
                "custom_fields[" + innerKey + "]",
                data[key][innerKey]
              );
            }
          });
        } else if (Array.isArray(data[key])) {
          // key !== "imageIds" &&
          data[key].length &&
            data[key].map((image) => {
              formData.append(key + "[]", image);
            });
        } else {
          formData.append(key, data[key]);
        }
      });
      setMultipartHeader();

      api
        .post("listing/form", formData, {
          onUploadProgress: (value) => testLogProgressValue(value),
        })
        .then((res) => {
          if (res.ok) {
            removeMultipartHeader();
            removeAuthToken();
            setUpdateLoading(false);
            // flashShow(true);
            setHasImage((prevHasImage) => false);
            setSuccess(true);
            // refresh my ads screen
          } else {
            // flashShow(false);
            // TODO Error handling
            removeMultipartHeader();
            removeAuthToken();
            setUpdateLoading(false);
            setHasImage((prevHasImage) => false);
            setError(true);
          }
        });
    } else {
      delete data.gallery;
      api.post("listing/form", data).then((res) => {
        if (res.ok) {
          removeAuthToken();
          setUpdateLoading(false);
          // flashShow(true);
          setSuccess(true);
          // refresh my ads screen
        } else {
          // TODO Error handling
          removeAuthToken();
          setUpdateLoading(false);
          // flashShow(false);
          setError(true);
        }
      });
    }
  };

  const commonFieldErrorValidation = () => {
    const errorData = commonRequiredFields.filter((item) => {
      if (listingCommonData[item]) {
        return false;
      } else {
        if (item === "gallery") {
          return !imageUris.length;
        } else {
          return true;
        }
      }
    });
    setCommonErrorFields(errorData);
  };

  const handleDateTime = (payLoad, field) => {
    setListingCustomData((prevListingCustomData) => {
      return {
        ...prevListingCustomData,
        [field.meta_key]: moment(payLoad).format(field.date.jsFormat),
      };
    });
    setTouchedFields((prevtouchedFields) =>
      Array.from(new Set([...prevtouchedFields, field.meta_key]))
    );
  };

  const handleDateTimeRange = (type, payLoad, field) => {
    if (type === "start") {
      const newRangeStart = [
        moment(payLoad).format(field.date.jsFormat),
        listingCustomData[field.meta_key]
          ? listingCustomData[field.meta_key][1]
            ? listingCustomData[field.meta_key][1]
            : moment(payLoad).format(field.date.jsFormat)
          : moment(payLoad).format(field.date.jsFormat),
      ];
      setListingCustomData((prevListingCustomData) => {
        return { ...prevListingCustomData, [field.meta_key]: newRangeStart };
      });
    } else {
      const newRangeEnd = [
        listingCustomData[field.meta_key]
          ? listingCustomData[field.meta_key][0]
            ? listingCustomData[field.meta_key][0]
            : moment(payLoad).format(field.date.jsFormat)
          : moment(payLoad).format(field.date.jsFormat),
        moment(payLoad).format(field.date.jsFormat),
      ];
      setListingCustomData((prevListingCustomData) => {
        return { ...prevListingCustomData, [field.meta_key]: newRangeEnd };
      });
    }
    setTouchedFields((prevtouchedFields) =>
      Array.from(new Set([...prevtouchedFields, field.meta_key]))
    );
  };

  const handleImageReorder = (data) => {
    setImageUris((prevImageUris) => data);

    const sorted = data.map((uri) => {
      const temp = existingImageObjects.filter((obj) => obj.uri === uri)[0];
      if (temp) {
        return temp.id;
      } else {
        return uri.split("/").pop();
      }
    });
    setSortedImages(sorted.reverse());
  };

  const handleEventOnAnimationDone = () => {
    setSubmitting(false);
    navigation.goBack();
  };

  const updatePriceType = (item) => {
    setListingCommonData((prevListingCommonData) => {
      return {
        ...prevListingCommonData,
        ["price_type"]: item.id,
      };
    });

    if (item.id === "on_call") {
      const tempComReqFlds = commonRequiredFields.filter(
        (field) => !["price", "max_price"].includes(field)
      );
      setCommonRequiredFields(tempComReqFlds);
    } else {
      if (
        listingCommonData.pricing_type === "range" &&
        !listingData.config.hidden_fields.includes("pricing_type")
      ) {
        const tempComReqFlds = Array.from(
          new Set([...commonRequiredFields, "price", "max_price"])
        );
        setCommonRequiredFields(tempComReqFlds);
      }
      if (listingCommonData.pricing_type === "price") {
        const tempComReqFlds = Array.from(
          new Set([...commonRequiredFields, "price"])
        );
        setCommonRequiredFields(tempComReqFlds);
      }
    }
    setTouchedFields((prevTouchedFields) =>
      Array.from(new Set([...prevTouchedFields, "price_type"]))
    );
  };

  const updatePricingType = (item) => {
    setListingCommonData((prevListingCommonData) => {
      return {
        ...prevListingCommonData,
        ["pricing_type"]: item.id,
      };
    });

    if (item.id === "disabled") {
      const tempComReqFlds = commonRequiredFields.filter(
        (field) => !["price", "max_price", "price_type"].includes(field)
      );
      setCommonRequiredFields(tempComReqFlds);
    } else {
      if (item.id === "price") {
        const tempComReqFlds = Array.from(
          new Set([...commonRequiredFields, "price"])
        ).filter((field) => field !== "max_price");

        setCommonRequiredFields(tempComReqFlds);
        if (Object.keys(listingCommonData).includes("max_price")) {
          delete listingCommonData.max_price;
        }
      }
      if (item.id === "range") {
        const tempComReqFields = Array.from(
          new Set([...commonRequiredFields, "price", "max_price"])
        );
        setCommonRequiredFields(tempComReqFields);
      }
    }
    setTouchedFields((prevTouchedFields) =>
      Array.from(new Set([...prevTouchedFields, "pricing_type"]))
    );
  };

  const handleMapTypeChange = () => {
    if (mapType == "standard") {
      setMapType("hybrid");
    } else {
      setMapType("standard");
    }
  };

  const handleMarkerReleaseEvent = (coords, func) => {
    setLocationLoading((prevLocationloading) => true);
    setRegion((prevRegion) => coords);
    setMarkerPosition((prevMarkerPosition) => coords);

    Geocoder.from(coords.latitude, coords.longitude)
      .then((json) => {
        var addressComponent = json?.results[0]?.formatted_address || "";
        if (config.location_type === "local") {
          func("address", decodeString(addressComponent));

          const postalCode =
            json?.results[0]?.address_components?.filter(
              (comp) => comp?.types?.includes("postal_code") || ""
            ) || "";

          func("zipcode", postalCode[0].long_name);
        } else {
          if (addressComponent) {
            setListingGeoAddress((prevListingGeoAddress) =>
              decodeString(addressComponent)
            );
          }
        }
      })
      .catch((error) => {
        console.warn(error);
        if (error.origin.status === "REQUEST_DENIED") {
          setGeoCoderFailedMessage(error.origin.error_message);
          setGeoCoderFail(true);
          setLoading(false);
        }
        // TODO  display error
      });

    setLocationLoading((prevLocationloading) => false);
  };

  const handleGetDeviceLocation = (func) => {
    setLocationLoading((prevLocationloading) => true);
    getLocationPermissionAsync(func);
  };

  const getLocationPermissionAsync = async (func) => {
    let { status } = await Location.requestPermissionsAsync();
    if (status !== "granted") {
      alert("Need to enable Location permission to use this feature");
      return;
    }
    let location = await Location.getCurrentPositionAsync({});

    setRegion((prevRegion) => {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    });
    setMarkerPosition((prevMarkerPosition) => {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    });

    Geocoder.from(location.coords.latitude, location.coords.longitude)
      .then((json) => {
        var addressComponent = json?.results[0]?.formatted_address || "";
        if (config.location_type === "local") {
          func("address", decodeString(addressComponent));

          const postalCode =
            json?.results[0]?.address_components?.filter(
              (comp) => comp?.types?.includes("postal_code") || ""
            ) || "";

          func("zipcode", postalCode[0].long_name);
        } else {
          if (addressComponent) {
            setListingGeoAddress((prevListingGeoAddress) =>
              decodeString(addressComponent)
            );
          }
        }
      })
      .catch((error) => {
        console.warn(error);
        if (error.origin.status === "REQUEST_DENIED") {
          setGeoCoderFailedMessage(error.origin.error_message);
          setGeoCoderFail(true);
          setLoading(false);
        }
        // TODO  display error
      });

    setLocationLoading((prevLocationloading) => false);
  };

  const handleReGeocoding = (values, payload) => {
    let geoAddress = [];
    if (payload.address) {
      geoAddress.push(payload.address);
    } else {
      geoAddress.push(values.address);
    }
    if (payload.zipcode) {
      geoAddress.push(payload.zipcode);
    } else {
      geoAddress.push(values.zipcode);
    }
    if (
      config.location_type === "local" &&
      listingData.listing.contact.locations.length
    ) {
      listingData.listing.contact.locations
        .reverse()
        .map((_location) => geoAddress.push(_location.name));
    }
    geoAddress = geoAddress.length ? decodeString(geoAddress.join(", ")) : "";
    handleGetGeoLatLng(geoAddress);
  };

  const handleGetGeoLatLng = useCallback(
    debounce((data) => {
      setLocationLoading((prevLocationloading) => true);

      Geocoder.from(data)
        .then((json) => {
          var location = json.results[0].geometry.location;
          const position = {
            latitude: location.lat,
            longitude: location.lng,
          };
          setRegion(position);
          setMarkerPosition(position);
          setLocationLoading((prevLocationloading) => false);
        })
        .catch((error) => {
          if (error.origin.status === "REQUEST_DENIED") {
            setGeoCoderFailedMessage(error.origin.error_message);
            setGeoCoderFail(true);
            setLoading(false);
          }
          setLocationLoading((prevLocationloading) => false);
          // TODO : error notice
        });
    }, 1000),
    []
  );

  const getUserName = () => {
    if (!!user.first_name || !!user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (!!user.username) {
      return user.username;
    }
  };

  const handleGalleryTouched = () => {
    setTouchedFields((prevtouchedFields) =>
      Array.from(new Set([...prevtouchedFields, "gallery"]))
    );
  };

  return (
    <>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.text}>
            {__("editListingScreenTexts.loading", appSettings.lng)}
          </Text>
        </View>
      )}
      {submitting && (
        <View
          style={{ alignItems: "center", justifyContent: "center", flex: 1 }}
        >
          {((!!uploadProgress && !success && !error) ||
            (!uploadProgress && !success && !error)) && (
            <View style={{ height: 150, width: 150 }}>
              <UploadingIndicator />
            </View>
          )}
          {!!success && !error && (
            <View style={{ height: 150, width: 150 }}>
              <DoneIndicator
                visible={true}
                onDone={handleEventOnAnimationDone}
              />
            </View>
          )}
          {!success && !!error && (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: screenWidth,
                height: screenWidth,
              }}
            >
              <ErrorIndicator
                visible={true}
                // onDone={handleEventOnAnimationDone}
              />
              <View style={{ position: "absolute", bottom: "30%" }}>
                <Text style={styles.text}>
                  {__(
                    "editListingScreenTexts.uploadErrorNotice",
                    appSettings.lng
                  )}
                </Text>
              </View>
            </View>
          )}
          {uploadProgress < 1 && hasImage && !success && !error && (
            // !success &&
            <Progress.Bar
              progress={uploadProgress}
              width={200}
              color={COLORS.primary}
            />
          )}

          {((uploadProgress < 1 && !success && hasImage && !error) ||
            (!success && !hasImage && !error)) && (
            <Text
              style={{
                fontSize: 15,
                color: COLORS.text_gray,
                textAlign: "center",
                marginTop: 25,
              }}
            >
              {__("editListingScreenTexts.uploadingNotice", appSettings.lng)}
            </Text>
          )}

          {!!error && (
            <View
              style={{
                position: "absolute",
                bottom: 20,
              }}
            >
              <AppButton
                title={__(
                  "editListingScreenTexts.buttonTitles.tryAgain",
                  appSettings.lng
                )}
                onPress={() => setSubmitting((prevSubmitting) => false)}
              />
            </View>
          )}
        </View>
      )}
      {!loading &&
        !submitting &&
        (ios ? (
          <KeyboardAvoidingView
            behavior="padding"
            style={{ flex: 1 }}
            keyboardVerticalOffset={80}
          >
            <ScrollView>
              <View style={styles.container}>
                <View style={styles.titleWrap}>
                  <Text style={styles.formTitle}>
                    {__("editListingScreenTexts.title", appSettings.lng)}
                  </Text>
                </View>
                <View style={styles.mainWrap}>
                  <View style={styles.formFieldsWrap}>
                    {/* Image Input Component */}
                    {listingData.config.gallery && (
                      <View style={styles.imageInputWrap}>
                        <View style={styles.imageInputTitleWrap}>
                          <View style={styles.iconWrap}>
                            <Image
                              style={{
                                height: 25,
                                width: 25,
                                resizeMode: "contain",
                              }}
                              source={require("../assets/gallery_icon.png")}
                            />
                          </View>

                          <Text style={styles.imageInputLabel}>
                            {__(
                              "editListingScreenTexts.formFieldLabels.imageInput",
                              appSettings.lng
                            )}
                            {commonRequiredFields.includes("gallery") && (
                              <Text style={styles.required}> *</Text>
                            )}
                          </Text>
                        </View>
                        <View style={styles.imageInputNotes}>
                          {listingData.config.gallery.max_image_limit && (
                            <Text style={styles.imageInputNotesText}>
                              {__(
                                "editListingScreenTexts.maxImageCount",
                                appSettings.lng
                              )}
                              {listingData.config.gallery.max_image_limit}
                              {__(
                                "editListingScreenTexts.images",
                                appSettings.lng
                              )}
                            </Text>
                          )}
                          {listingData.config.gallery.max_image_limit > 1 && (
                            <Text style={styles.imageInputNotesText}>
                              {__(
                                "editListingScreenTexts.dragAndSort",
                                appSettings.lng
                              )}
                            </Text>
                          )}
                        </View>
                        <ImageInputList
                          imageUris={imageUris}
                          onAddImage={handleAddImage}
                          onRemoveImage={handleRemoveImage}
                          maxCount={listingData.config.gallery.max_image_limit}
                          reorder={handleImageReorder}
                          handleTouch={handleGalleryTouched}
                        />
                        <View
                          style={[
                            styles.inputFieldErrorWrap,
                            {
                              marginHorizontal: "3%",
                              alignItems: "center",
                              justifyContent: "center",
                            },
                          ]}
                        >
                          {commonErrorFields.includes("gallery") &&
                            touchedFields.includes("gallery") && (
                              <Text style={styles.inputFieldErrorMessage}>
                                {__(
                                  "editListingScreenTexts.imageFieldCustomError",
                                  appSettings.lng
                                )}
                              </Text>
                            )}
                        </View>
                      </View>
                    )}

                    <Formik
                      initialValues={{
                        title: listingData.listing.title
                          ? decodeString(listingData.listing.title)
                          : "",

                        description: listingData.listing.description
                          ? decodeString(listingData.listing.description)
                          : "",
                        name: user ? getUserName() : "",
                        zipcode: listingData.listing.contact.zipcode
                          ? listingData.listing.contact.zipcode
                          : user.zipcode
                          ? user.zipcode
                          : "",
                        address: listingData.listing.contact.address
                          ? decodeString(listingData.listing.contact.address)
                          : user.address
                          ? decodeString(user.address)
                          : "",
                        phone: listingData.listing.contact.phone
                          ? listingData.listing.contact.phone
                          : user.phone
                          ? user.phone
                          : "",
                        whatsapp_number: listingData.listing.contact
                          .whatsapp_number
                          ? listingData.listing.contact.whatsapp_number
                          : user.whatsapp_number
                          ? user.whatsapp_number
                          : "",
                        email: listingData.listing.contact.email
                          ? listingData.listing.contact.email
                          : user.email
                          ? user.email
                          : "",
                        website: listingData.listing.contact.website
                          ? listingData.listing.contact.website
                          : user.website
                          ? user.website
                          : "",
                        video_urls: listingData?.listing?.video_urls
                          ? listingData?.listing?.video_urls[0]
                          : "" || "",
                      }}
                      onSubmit={handleUpdateListing}
                      validationSchema={validationSchema}
                    >
                      {({
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        values,
                        errors,
                        touched,
                        setFieldTouched,
                        setFieldValue,
                      }) => (
                        <View>
                          {/* Common Fields (Title, Pricing Type, Price Type, Price) */}
                          <View style={styles.commonFieldsWrap}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: "3%",
                              }}
                            >
                              <View style={styles.iconWrap}>
                                <Image
                                  style={{
                                    height: 25,
                                    width: 25,
                                    resizeMode: "contain",
                                  }}
                                  source={require("../assets/product_info_icon.png")}
                                />
                              </View>
                              <Text style={styles.title}>
                                {__(
                                  "editListingScreenTexts.formFieldLabels.formTitle",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                            <AppSeparator
                              style={{
                                marginVertical: 20,
                                width: "94%",
                                marginHorizontal: "3%",
                              }}
                            />
                            <View style={styles.commonInputWrap}>
                              <Text style={styles.commonInputLabel}>
                                {__(
                                  "editListingScreenTexts.formFieldLabels.listingTitle",
                                  appSettings.lng
                                )}
                                <Text style={styles.required}> *</Text>
                              </Text>
                              <TextInput
                                style={styles.commonInputField}
                                onChangeText={handleChange("title")}
                                onBlur={() => setFieldTouched("title")}
                                value={values.title}
                              />
                              <View style={styles.inputFieldErrorWrap}>
                                {errors.title && touched.title && (
                                  <Text style={styles.inputFieldErrorMessage}>
                                    {errors.title}
                                  </Text>
                                )}
                              </View>
                            </View>

                            {!listingData.config.hidden_fields.includes(
                              "pricing_type"
                            ) &&
                              listingData?.config?.pricing_types && (
                                <View style={styles.commonInputWrap}>
                                  <Text style={styles.commonInputLabel}>
                                    {__(
                                      "editListingScreenTexts.formFieldLabels.pricingLabel",
                                      appSettings.lng
                                    )}
                                    <Text style={styles.required}> *</Text>
                                  </Text>
                                  <View style={styles.priceTypePickerWrap}>
                                    <AppRadioButton
                                      field={listingData.config.pricing_types}
                                      handleClick={updatePricingType}
                                      selected={listingCommonData.pricing_type}
                                    />
                                  </View>

                                  <View style={styles.inputFieldErrorWrap}>
                                    {!listingCommonData.pricing_type && (
                                      <Text
                                        style={styles.inputFieldErrorMessage}
                                      >
                                        {__(
                                          "editListingScreenTexts.requiredFieldCustomError",
                                          appSettings.lng
                                        )}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              )}
                            {!listingData.config.hidden_fields.includes(
                              "price_type"
                            ) &&
                              listingCommonData.pricing_type !== "disabled" && (
                                <View style={styles.commonInputWrap}>
                                  <Text style={styles.commonInputLabel}>
                                    {__(
                                      "editListingScreenTexts.formFieldLabels.priceType",
                                      appSettings.lng
                                    )}
                                    <Text style={styles.required}> *</Text>
                                  </Text>
                                  <View style={styles.priceTypePickerWrap}>
                                    <AppRadioButton
                                      field={listingData.config.price_types}
                                      handleClick={updatePriceType}
                                      selected={listingCommonData.price_type}
                                    />
                                  </View>

                                  <View style={styles.inputFieldErrorWrap}>
                                    {!listingCommonData.price_type && (
                                      <Text
                                        style={styles.inputFieldErrorMessage}
                                      >
                                        {__(
                                          "editListingScreenTexts.requiredFieldCustomError",
                                          appSettings.lng
                                        )}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              )}
                            {!listingData.config.hidden_fields.includes(
                              "price"
                            ) &&
                              listingCommonData.price_type !== "on_call" &&
                              listingCommonData.pricing_type !== "disabled" && (
                                <>
                                  {listingCommonData.pricing_type !== "range" ||
                                  listingData.config.hidden_fields.includes(
                                    "pricing_type"
                                  ) ? (
                                    <View style={styles.commonInputWrap}>
                                      <Text style={styles.commonInputLabel}>
                                        {`${__(
                                          "editListingScreenTexts.formFieldLabels.price",
                                          appSettings.lng
                                        )} (${getCurrencySymbol(
                                          config.currency
                                        )})`}
                                        {listingCommonData.price_type !==
                                          "on_call" && (
                                          <Text style={styles.required}>
                                            {" "}
                                            *
                                          </Text>
                                        )}
                                      </Text>
                                      <TextInput
                                        style={styles.commonInputField}
                                        onChangeText={(value) => {
                                          setListingCommonData(
                                            (listingCommonData) => {
                                              return {
                                                ...listingCommonData,
                                                ["price"]: value,
                                              };
                                            }
                                          );
                                        }}
                                        onBlur={() => {
                                          setTouchedFields(
                                            (prevTouchedFields) =>
                                              Array.from(
                                                new Set([
                                                  ...prevTouchedFields,
                                                  "price",
                                                ])
                                              )
                                          );
                                        }}
                                        value={listingCommonData.price}
                                        keyboardType="decimal-pad"
                                      />
                                      <View style={styles.inputFieldErrorWrap}>
                                        {commonErrorFields.includes(
                                          "price"
                                        ) && (
                                          <Text
                                            style={
                                              styles.inputFieldErrorMessage
                                            }
                                          >
                                            {__(
                                              "editListingScreenTexts.requiredFieldCustomError",
                                              appSettings.lng
                                            )}
                                          </Text>
                                        )}
                                      </View>
                                    </View>
                                  ) : (
                                    <View
                                      style={[
                                        styles.commonInputWrap,
                                        {
                                          flexDirection: "row",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                        },
                                      ]}
                                    >
                                      <View style={{ width: "48.5%" }}>
                                        <Text style={styles.commonInputLabel}>
                                          {`${__(
                                            "editListingScreenTexts.formFieldLabels.price",
                                            appSettings.lng
                                          )} (${getCurrencySymbol(
                                            config.currency
                                          )})`}
                                          {listingCommonData.price_type !==
                                            "on_call" && (
                                            <Text style={styles.required}>
                                              {" "}
                                              *
                                            </Text>
                                          )}
                                        </Text>
                                        <TextInput
                                          style={styles.commonInputField}
                                          onChangeText={(value) => {
                                            setListingCommonData(
                                              (listingCommonData) => {
                                                return {
                                                  ...listingCommonData,
                                                  ["price"]: value,
                                                };
                                              }
                                            );
                                          }}
                                          onBlur={() => {
                                            setTouchedFields(
                                              (prevTouchedFields) =>
                                                Array.from(
                                                  new Set([
                                                    ...prevTouchedFields,
                                                    "price",
                                                  ])
                                                )
                                            );
                                          }}
                                          value={listingCommonData.price}
                                          keyboardType="decimal-pad"
                                        />
                                        <View
                                          style={styles.inputFieldErrorWrap}
                                        >
                                          {commonErrorFields.includes(
                                            "price"
                                          ) && (
                                            <Text
                                              style={
                                                styles.inputFieldErrorMessage
                                              }
                                            >
                                              {__(
                                                "editListingScreenTexts.requiredFieldCustomError",
                                                appSettings.lng
                                              )}
                                            </Text>
                                          )}
                                        </View>
                                      </View>

                                      <View style={{ width: "48.5%" }}>
                                        <Text style={styles.commonInputLabel}>
                                          {`${__(
                                            "editListingScreenTexts.formFieldLabels.maxPrice",
                                            appSettings.lng
                                          )} (${getCurrencySymbol(
                                            config.currency
                                          )})`}
                                          {listingCommonData.price_type !==
                                            "on_call" &&
                                            listingCommonData.pricing_type ===
                                              "range" && (
                                              <Text style={styles.required}>
                                                {" "}
                                                *
                                              </Text>
                                            )}
                                        </Text>
                                        <TextInput
                                          style={styles.commonInputField}
                                          onChangeText={(value) => {
                                            setListingCommonData(
                                              (listingCommonData) => {
                                                return {
                                                  ...listingCommonData,
                                                  ["max_price"]: value,
                                                };
                                              }
                                            );
                                          }}
                                          onBlur={() => {
                                            setTouchedFields(
                                              (prevTouchedFields) =>
                                                Array.from(
                                                  new Set([
                                                    ...prevTouchedFields,
                                                    "max_price",
                                                  ])
                                                )
                                            );
                                          }}
                                          value={listingCommonData.max_price}
                                          keyboardType="decimal-pad"
                                        />
                                        <View
                                          style={styles.inputFieldErrorWrap}
                                        >
                                          {commonErrorFields.includes(
                                            "max_price"
                                          ) && (
                                            <Text
                                              style={
                                                styles.inputFieldErrorMessage
                                              }
                                            >
                                              {__(
                                                "editListingScreenTexts.requiredFieldCustomError",
                                                appSettings.lng
                                              )}
                                            </Text>
                                          )}
                                        </View>
                                      </View>
                                    </View>
                                  )}
                                </>
                              )}
                          </View>
                          {/* Custom Fields */}
                          {listingData.custom_fields && (
                            <View style={styles.customFieldsWrap}>
                              {listingData.custom_fields.map((field) => (
                                <View
                                  key={field.meta_key}
                                  style={styles.metaField}
                                >
                                  {validateCfDependency.includes(field.id) && (
                                    <>
                                      <Text style={styles.label}>
                                        {decodeString(field.label)}
                                        {field.required && (
                                          <Text style={styles.required}>
                                            {" "}
                                            *
                                          </Text>
                                        )}
                                      </Text>
                                      {[
                                        "text",
                                        "textarea",
                                        "url",
                                        "number",
                                      ].includes(field.type) && (
                                        <TextInput
                                          style={
                                            field.type === "textarea"
                                              ? styles.metaField_TextArea
                                              : styles.metaField_Text
                                          }
                                          onChangeText={(value) =>
                                            handleTextData(
                                              field.meta_key,
                                              value
                                            )
                                          }
                                          value={
                                            listingCustomData[field.meta_key]
                                              ? listingCustomData[
                                                  field.meta_key
                                                ]
                                              : ""
                                          }
                                          textAlignVertical={
                                            field.type === "textarea"
                                              ? "top"
                                              : "auto"
                                          }
                                          multiline={field.type === "textarea"}
                                          keyboardType={
                                            field.type === "number"
                                              ? "decimal-pad"
                                              : "default"
                                          }
                                          contextMenuHidden={
                                            field.type === "number"
                                          }
                                          placeholder={field.placeholder}
                                          onBlur={() =>
                                            setTouchedFields(
                                              (prevTouchedFields) =>
                                                Array.from(
                                                  new Set([
                                                    ...prevTouchedFields,
                                                    field.meta_key,
                                                  ])
                                                )
                                            )
                                          }
                                        />
                                      )}
                                      {field.type === "select" && (
                                        <View style={styles.dynamicPickerWrap}>
                                          <DynamicListPicker
                                            field={field}
                                            onselect={(item) =>
                                              setListingCustomData(
                                                (listingCustomData) => {
                                                  return {
                                                    ...listingCustomData,
                                                    [field.meta_key]: item.id,
                                                  };
                                                }
                                              )
                                            }
                                            selected={
                                              field.value
                                                ? field.value
                                                : undefined
                                            }
                                            handleTouch={() =>
                                              setTouchedFields(
                                                (prevTouchedFields) =>
                                                  Array.from(
                                                    new Set([
                                                      ...prevTouchedFields,
                                                      field.meta_key,
                                                    ])
                                                  )
                                              )
                                            }
                                          />
                                        </View>
                                      )}
                                      {field.type === "radio" && (
                                        <View style={styles.dynamicRadioWrap}>
                                          <DynamicRadioButton
                                            field={field}
                                            handleClick={(item) => {
                                              setListingCustomData(
                                                (listingCustomData) => {
                                                  return {
                                                    ...listingCustomData,
                                                    [field.meta_key]: item.id,
                                                  };
                                                }
                                              );
                                              setTouchedFields(
                                                (prevTouchedFields) =>
                                                  Array.from(
                                                    new Set([
                                                      ...prevTouchedFields,
                                                      field.meta_key,
                                                    ])
                                                  )
                                              );
                                            }}
                                            selected={
                                              listingCustomData[
                                                `${field.meta_key}`
                                              ]
                                            }
                                          />
                                        </View>
                                      )}
                                      {field.type === "checkbox" && (
                                        <View
                                          style={styles.dynamicCheckboxWrap}
                                        >
                                          <DynamicCheckbox
                                            field={field}
                                            handleClick={(value) => {
                                              setListingCustomData(
                                                (listingCustomData) => {
                                                  return {
                                                    ...listingCustomData,
                                                    [field.meta_key]: value,
                                                  };
                                                }
                                              );
                                              setTouchedFields(
                                                (prevTouchedFields) =>
                                                  Array.from(
                                                    new Set([
                                                      ...prevTouchedFields,
                                                      field.meta_key,
                                                    ])
                                                  )
                                              );
                                            }}
                                            selected={
                                              field.value.length
                                                ? field.value
                                                : []
                                            }
                                          />
                                        </View>
                                      )}
                                      {field.type === "date" && (
                                        <View style={styles.dateFieldWrap}>
                                          {["date", "date_time"].includes(
                                            field.date.type
                                          ) && (
                                            <DatePicker
                                              field={field}
                                              onSelect={handleDateTime}
                                              value={
                                                listingCustomData[
                                                  field.meta_key
                                                ]
                                                  ? listingCustomData[
                                                      field.meta_key
                                                    ]
                                                  : null
                                              }
                                            />
                                          )}
                                          {[
                                            "date_range",
                                            "date_time_range",
                                          ].includes(field.date.type) && (
                                            <DateRangePicker
                                              field={field}
                                              value={
                                                !!listingCustomData[
                                                  field.meta_key
                                                ][0] ||
                                                !!listingCustomData[
                                                  field.meta_key
                                                ][1]
                                                  ? listingCustomData[
                                                      field.meta_key
                                                    ]
                                                  : null
                                              }
                                              onSelect={handleDateTimeRange}
                                            />
                                          )}
                                        </View>
                                      )}
                                      <View style={styles.inputFieldErrorWrap}>
                                        {customErrorFields.includes(field) &&
                                          touchedFields.includes(
                                            field.meta_key
                                          ) && (
                                            <Text
                                              style={
                                                styles.inputFieldErrorMessage
                                              }
                                            >
                                              {__(
                                                "editListingScreenTexts.requiredFieldCustomError",
                                                appSettings.lng
                                              )}
                                            </Text>
                                          )}
                                      </View>
                                    </>
                                  )}
                                </View>
                              ))}
                            </View>
                          )}
                          {/* Common Fields (Video Url & Description) */}
                          <View style={styles.commonFieldsWrap}>
                            {!!listingData?.config?.video_urls && (
                              <View style={styles.commonInputWrap}>
                                <Text style={styles.commonInputLabel}>
                                  {__(
                                    "editListingScreenTexts.formFieldLabels.videoUrl",
                                    appSettings.lng
                                  )}
                                </Text>
                                <TextInput
                                  style={styles.metaField_Text}
                                  onChangeText={handleChange("video_urls")}
                                  onBlur={handleBlur("video_urls")}
                                  value={values.video_urls}
                                  placeholder={__(
                                    "editListingScreenTexts.formFieldLabels.videoUrl",
                                    appSettings.lng
                                  )}
                                />
                                <Text style={styles.Text}>
                                  {__(
                                    "editListingScreenTexts.videoUrlNote",
                                    appSettings.lng
                                  )}
                                </Text>
                                <View style={styles.inputFieldErrorWrap}>
                                  {errors.video_urls && touched.video_urls && (
                                    <Text style={styles.inputFieldErrorMessage}>
                                      {errors.video_urls}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            )}
                            {!listingData.config.hidden_fields.includes(
                              "description"
                            ) && (
                              <View style={styles.commonInputWrap}>
                                <Text style={styles.commonInputLabel}>
                                  {__(
                                    "editListingScreenTexts.formFieldLabels.listingDescription",
                                    appSettings.lng
                                  )}
                                </Text>
                                <TextInput
                                  style={styles.metaField_TextArea}
                                  onChangeText={handleChange("description")}
                                  onBlur={handleBlur("description")}
                                  value={values.description}
                                  textAlignVertical="top"
                                  multiline
                                  placeholder={__(
                                    "editListingScreenTexts.formFieldLabels.listingDescription",
                                    appSettings.lng
                                  )}
                                />
                                <View style={styles.inputFieldErrorWrap}>
                                  {errors.description &&
                                    touched.description && (
                                      <Text
                                        style={styles.inputFieldErrorMessage}
                                      >
                                        {errors.price}
                                      </Text>
                                    )}
                                </View>
                              </View>
                            )}
                          </View>
                          {/* Contact Section */}
                          <View style={styles.contactSectionWrap}>
                            <View style={styles.contactTitleWrap}>
                              <View style={styles.iconWrap}>
                                <Image
                                  style={{
                                    height: 25,
                                    width: 25,
                                    resizeMode: "contain",
                                  }}
                                  source={require("../assets/my_profile.png")}
                                />
                              </View>
                              <Text style={styles.title}>
                                {__(
                                  "editListingScreenTexts.formFieldLabels.contact",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                            {/* Name Input */}
                            {!listingData.config.hidden_fields.includes(
                              "name"
                            ) && (
                              <View style={styles.commonInputWrap}>
                                <Text style={styles.commonInputLabel}>
                                  {__(
                                    "editListingScreenTexts.formFieldLabels.name",
                                    appSettings.lng
                                  )}
                                  <Text style={styles.required}> *</Text>
                                </Text>
                                <TextInput
                                  style={styles.commonInputField}
                                  onChangeText={handleChange("name")}
                                  onBlur={handleBlur("name")}
                                  value={values.name}
                                  editable={!user.first_name && !user.last_name}
                                />
                                <View style={styles.inputFieldErrorWrap}>
                                  {errors.name && touched.name && (
                                    <Text style={styles.inputFieldErrorMessage}>
                                      {errors.name}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            )}
                            {/* Phone Input */}
                            {!listingData.config.hidden_fields.includes(
                              "phone"
                            ) && (
                              <View style={styles.commonInputWrap}>
                                <Text style={styles.commonInputLabel}>
                                  {__(
                                    "editListingScreenTexts.formFieldLabels.phone",
                                    appSettings.lng
                                  )}
                                  <Text style={styles.required}> *</Text>
                                </Text>
                                <TextInput
                                  style={styles.commonInputField}
                                  onChangeText={handleChange("phone")}
                                  onBlur={handleBlur("phone")}
                                  value={values.phone}
                                />
                                <View style={styles.inputFieldErrorWrap}>
                                  {errors.phone && touched.phone && (
                                    <Text style={styles.inputFieldErrorMessage}>
                                      {errors.phone}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            )}
                            {/* Whatsapp Input */}
                            {!listingData.config.hidden_fields.includes(
                              "whatsapp_number"
                            ) && (
                              <View style={styles.commonInputWrap}>
                                <Text style={styles.commonInputLabel}>
                                  {__(
                                    "editListingScreenTexts.formFieldLabels.whatsapp",
                                    appSettings.lng
                                  )}
                                </Text>
                                <TextInput
                                  style={styles.commonInputField}
                                  onChangeText={handleChange("whatsapp_number")}
                                  onBlur={handleBlur("whatsapp_number")}
                                  value={values.whatsapp_number}
                                />
                                <Text style={styles.Text}>
                                  {__(
                                    "editListingScreenTexts.whatsappNote",
                                    appSettings.lng
                                  )}
                                </Text>
                                <View style={styles.inputFieldErrorWrap}>
                                  {errors.whatsapp_number &&
                                    touched.whatsapp_number && (
                                      <Text
                                        style={styles.inputFieldErrorMessage}
                                      >
                                        {errors.whatsapp_number}
                                      </Text>
                                    )}
                                </View>
                              </View>
                            )}
                            {/* Email Input */}
                            {!listingData.config.hidden_fields.includes(
                              "email"
                            ) && (
                              <View style={styles.commonInputWrap}>
                                <Text style={styles.commonInputLabel}>
                                  {__(
                                    "editListingScreenTexts.formFieldLabels.email",
                                    appSettings.lng
                                  )}
                                  <Text style={styles.required}> *</Text>
                                </Text>
                                <TextInput
                                  style={styles.commonInputField}
                                  onChangeText={handleChange("email")}
                                  onBlur={handleBlur("email")}
                                  value={values.email}
                                  editable={!values.email}
                                />
                                <View style={styles.inputFieldErrorWrap}>
                                  {errors.email && touched.email && (
                                    <Text style={styles.inputFieldErrorMessage}>
                                      {errors.email}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            )}
                            {/* Website Input */}
                            {!listingData.config.hidden_fields.includes(
                              "website"
                            ) && (
                              <View style={styles.commonInputWrap}>
                                <Text style={styles.commonInputLabel}>
                                  {__(
                                    "editListingScreenTexts.formFieldLabels.website",
                                    appSettings.lng
                                  )}
                                </Text>
                                <TextInput
                                  style={styles.commonInputField}
                                  onChangeText={handleChange("website")}
                                  onBlur={handleBlur("website")}
                                  value={values.website}
                                />
                                <View style={styles.inputFieldErrorWrap}>
                                  {errors.website && touched.website && (
                                    <Text style={styles.inputFieldErrorMessage}>
                                      {errors.website}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            )}
                            {/* ZipCode Input */}
                            {!listingData.config.hidden_fields.includes(
                              "zipcode"
                            ) &&
                              config.location_type === "local" && (
                                <View style={styles.commonInputWrap}>
                                  <Text style={styles.commonInputLabel}>
                                    {__(
                                      "editListingScreenTexts.formFieldLabels.zipCode",
                                      appSettings.lng
                                    )}
                                  </Text>
                                  <TextInput
                                    style={styles.commonInputField}
                                    onChangeText={(text) => {
                                      setFieldValue("zipcode", text);
                                      if (!geoCoderFail) {
                                        handleReGeocoding(values, {
                                          zipcode: text,
                                        });
                                      }
                                    }}
                                    onBlur={handleBlur("zipcode")}
                                    value={values.zipcode}
                                  />
                                  <View style={styles.inputFieldErrorWrap}>
                                    {errors.zipcode && touched.zipcode && (
                                      <Text
                                        style={styles.inputFieldErrorMessage}
                                      >
                                        {errors.zipcode}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              )}
                            {/* Address Input */}
                            {!listingData.config.hidden_fields.includes(
                              "address"
                            ) &&
                              config.location_type === "local" && (
                                <View style={styles.commonInputWrap}>
                                  <Text style={styles.commonInputLabel}>
                                    {__(
                                      "editListingScreenTexts.formFieldLabels.address",
                                      appSettings.lng
                                    )}
                                  </Text>
                                  <TextInput
                                    style={styles.commonInputField}
                                    onChangeText={(text) => {
                                      setFieldValue("address", text);
                                      if (!geoCoderFail) {
                                        handleReGeocoding(values, {
                                          address: text,
                                        });
                                      }
                                    }}
                                    onBlur={handleBlur("address")}
                                    value={values.address}
                                    placeholder={__(
                                      "editListingScreenTexts.formFieldLabels.address",
                                      appSettings.lng
                                    )}
                                  />
                                  <View style={styles.inputFieldErrorWrap}>
                                    {errors.address && touched.address && (
                                      <Text
                                        style={styles.inputFieldErrorMessage}
                                      >
                                        {errors.address}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              )}
                            {/* Google Address Component */}
                            {config.location_type === "google" &&
                              !geoCoderFail && (
                                <View style={styles.commonInputWrap}>
                                  <Text style={styles.commonInputLabel}>
                                    {__(
                                      "editListingScreenTexts.formFieldLabels.address",
                                      appSettings.lng
                                    )}
                                  </Text>

                                  <GooglePlacesAutocomplete
                                    placeholder={
                                      listingGeoAddress
                                        ? listingGeoAddress
                                        : "Search Address"
                                    }
                                    textInputProps={{
                                      placeholderTextColor: listingGeoAddress
                                        ? COLORS.black
                                        : "#b6b6b6",
                                    }}
                                    onPress={(data, details = null) => {
                                      if (data.description) {
                                        setListingGeoAddress(
                                          (prevListingGeoAddress) =>
                                            data.description
                                        );
                                      }
                                      if (details.geometry.location) {
                                        const geoLocation = {
                                          latitude:
                                            details.geometry.location.lat,
                                          longitude:
                                            details.geometry.location.lng,
                                        };
                                        setRegion((prevRegion) => {
                                          return { ...geoLocation };
                                        });
                                        setMarkerPosition(
                                          (prevListingGeoAddress) => {
                                            return { ...geoLocation };
                                          }
                                        );
                                      }
                                    }}
                                    fetchDetails={true}
                                    query={{
                                      key: config.map.api_key,
                                      language: "en",
                                    }}
                                    debounce={200}
                                    timeout={15000} //15 seconds
                                  />

                                  <View style={styles.inputFieldErrorWrap}>
                                    {errors.address && touched.address && (
                                      <Text
                                        style={styles.inputFieldErrorMessage}
                                      >
                                        {errors.address}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              )}
                          </View>
                          {/* MapView */}
                          {config.map && (
                            <View>
                              {geoCoderFail ? (
                                <View
                                  style={{
                                    marginHorizontal: "3%",
                                  }}
                                >
                                  <View style={styles.geoCoderFailWrap}>
                                    <Text style={styles.geoCoderFailTitle}>
                                      {__(
                                        "editListingScreenTexts.geoCoderFail",
                                        appSettings.lng
                                      )}
                                    </Text>
                                    <Text style={styles.geoCoderFailMessage}>
                                      {geoCoderFailedMessage}
                                    </Text>
                                  </View>
                                </View>
                              ) : (
                                <>
                                  {/* Loading Component Inside Map */}
                                  {locationLoading && (
                                    <View style={styles.mapOverlay}>
                                      <ActivityIndicator
                                        size="large"
                                        color={COLORS.primary}
                                      />
                                    </View>
                                  )}
                                  {/* Map Mode Toggle Button */}
                                  <View style={styles.mapViewButtonsWrap}>
                                    <TouchableOpacity
                                      style={[
                                        styles.mapViewButton,
                                        {
                                          backgroundColor:
                                            mapType == "standard"
                                              ? COLORS.dodgerblue
                                              : "transparent",
                                        },
                                      ]}
                                      onPress={handleMapTypeChange}
                                      disabled={mapType == "standard"}
                                    >
                                      <Text
                                        style={[
                                          styles.mapViewButtonTitle,
                                          {
                                            color:
                                              mapType == "standard"
                                                ? COLORS.white
                                                : COLORS.text_gray,
                                          },
                                        ]}
                                      >
                                        {__(
                                          "editListingScreenTexts.buttonTitles.mapStandard",
                                          appSettings.lng
                                        )}
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[
                                        styles.mapViewButton,
                                        {
                                          backgroundColor:
                                            mapType == "hybrid"
                                              ? COLORS.dodgerblue
                                              : "transparent",
                                        },
                                      ]}
                                      onPress={handleMapTypeChange}
                                      disabled={mapType == "hybrid"}
                                    >
                                      <Text
                                        style={[
                                          styles.mapViewButtonTitle,
                                          {
                                            color:
                                              mapType == "hybrid"
                                                ? COLORS.white
                                                : COLORS.text_gray,
                                          },
                                        ]}
                                      >
                                        {__(
                                          "editListingScreenTexts.buttonTitles.mapHybrid",
                                          appSettings.lng
                                        )}
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                  {/* Map Component */}
                                  <MapView
                                    ref={mapViewRef}
                                    style={{
                                      width: screenWidth,
                                      height: screenWidth * 0.8,
                                    }}
                                    region={{
                                      ...region,
                                      latitudeDelta: 0.0135135,
                                      longitudeDelta: 0.0135135 * 0.8,
                                    }}
                                    provider={MapView.PROVIDER_GOOGLE}
                                    mapType={mapType}
                                    loadingEnabled={true}
                                    loadingIndicatorColor={COLORS.primary_soft}
                                    loadingBackgroundColor={COLORS.white}
                                  >
                                    <Marker
                                      coordinate={markerPosition}
                                      draggable
                                      onDragEnd={(event) =>
                                        handleMarkerReleaseEvent(
                                          event.nativeEvent.coordinate,
                                          setFieldValue
                                        )
                                      }
                                    />
                                  </MapView>
                                  {/* Hide Map Toggle */}
                                  <View style={styles.mapDisplayInputWrap}>
                                    <TouchableWithoutFeedback
                                      onPress={() =>
                                        setHideMap(
                                          (prevHideMap) => !prevHideMap
                                        )
                                      }
                                    >
                                      <View style={styles.mapCheckboxWrap}>
                                        <MaterialCommunityIcons
                                          name={
                                            hideMap
                                              ? "checkbox-marked"
                                              : "checkbox-blank-outline"
                                          }
                                          size={20}
                                          color={COLORS.primary}
                                        />
                                        <Text style={styles.mapToggleMessage}>
                                          {__(
                                            "editListingScreenTexts.mapToggleMessage",
                                            appSettings.lng
                                          )}
                                        </Text>
                                      </View>
                                    </TouchableWithoutFeedback>
                                  </View>
                                  {/* Device Location Button */}
                                  <TouchableOpacity
                                    style={[
                                      styles.deviceLocationButton,
                                      ios
                                        ? {
                                            shadowColor: "#000",
                                            shadowRadius: 4,
                                            shadowOpacity: 0.2,
                                            shadowOffset: {
                                              height: 2,
                                              width: 2,
                                            },
                                          }
                                        : { elevation: 1 },
                                    ]}
                                    onPress={() =>
                                      handleGetDeviceLocation(setFieldValue)
                                    }
                                    disabled={locationLoading}
                                  >
                                    <MaterialIcons
                                      name="my-location"
                                      size={24}
                                      color={
                                        locationLoading
                                          ? COLORS.primary_soft
                                          : COLORS.primary
                                      }
                                    />
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          )}
                          {/* Bottom notes */}
                          <View style={[styles.noteWrap]}>
                            <Text
                              style={[
                                styles.text,
                                {
                                  color:
                                    Object.keys(errors).length ||
                                    customErrorFields.length ||
                                    commonErrorFields.length
                                      ? COLORS.red
                                      : COLORS.text_gray,
                                },
                              ]}
                            >
                              {__(
                                "editListingScreenTexts.requiredFieldNotice",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          {/* Submit Button Component */}
                          <View style={{ paddingHorizontal: "3%" }}>
                            <AppButton
                              style={styles.updateButton}
                              title={__(
                                "editListingScreenTexts.buttonTitles.updateListing",
                                appSettings.lng
                              )}
                              onPress={handleSubmit}
                              loading={updateLoading}
                              disabled={
                                updateLoading ||
                                Object.keys(errors).length ||
                                customErrorFields.length ||
                                commonErrorFields.length
                              }
                            />
                          </View>
                        </View>
                      )}
                    </Formik>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          <ScrollView>
            <View style={styles.container}>
              <View style={styles.titleWrap}>
                <Text style={styles.formTitle}>
                  {__("editListingScreenTexts.title", appSettings.lng)}
                </Text>
              </View>
              <View style={styles.mainWrap}>
                <View style={styles.formFieldsWrap}>
                  {/* Image Input Component */}
                  {listingData.config.gallery && (
                    <View style={styles.imageInputWrap}>
                      <View style={styles.imageInputTitleWrap}>
                        <View style={styles.iconWrap}>
                          <Image
                            style={{
                              height: 25,
                              width: 25,
                              resizeMode: "contain",
                            }}
                            source={require("../assets/gallery_icon.png")}
                          />
                        </View>

                        <Text style={styles.imageInputLabel}>
                          {__(
                            "editListingScreenTexts.formFieldLabels.imageInput",
                            appSettings.lng
                          )}
                          {commonRequiredFields.includes("gallery") && (
                            <Text style={styles.required}> *</Text>
                          )}
                        </Text>
                      </View>
                      <View style={styles.imageInputNotes}>
                        {listingData.config.gallery.max_image_limit && (
                          <Text style={styles.imageInputNotesText}>
                            {__(
                              "editListingScreenTexts.maxImageCount",
                              appSettings.lng
                            )}
                            {listingData.config.gallery.max_image_limit}
                            {__(
                              "editListingScreenTexts.images",
                              appSettings.lng
                            )}
                          </Text>
                        )}
                        {listingData.config.gallery.max_image_limit > 1 && (
                          <Text style={styles.imageInputNotesText}>
                            {__(
                              "editListingScreenTexts.dragAndSort",
                              appSettings.lng
                            )}
                          </Text>
                        )}
                      </View>
                      <ImageInputList
                        imageUris={imageUris}
                        onAddImage={handleAddImage}
                        onRemoveImage={handleRemoveImage}
                        maxCount={listingData.config.gallery.max_image_limit}
                        reorder={handleImageReorder}
                        handleTouch={handleGalleryTouched}
                      />
                      <View
                        style={[
                          styles.inputFieldErrorWrap,
                          {
                            marginHorizontal: "3%",
                            alignItems: "center",
                            justifyContent: "center",
                          },
                        ]}
                      >
                        {commonErrorFields.includes("gallery") &&
                          touchedFields.includes("gallery") && (
                            <Text style={styles.inputFieldErrorMessage}>
                              {__(
                                "editListingScreenTexts.imageFieldCustomError",
                                appSettings.lng
                              )}
                            </Text>
                          )}
                      </View>
                    </View>
                  )}

                  <Formik
                    initialValues={{
                      title: listingData.listing.title
                        ? decodeString(listingData.listing.title)
                        : "",

                      description: listingData.listing.description
                        ? decodeString(listingData.listing.description)
                        : "",
                      name: user ? getUserName() : "",
                      zipcode: listingData.listing.contact.zipcode
                        ? listingData.listing.contact.zipcode
                        : user.zipcode
                        ? user.zipcode
                        : "",
                      address: listingData.listing.contact.address
                        ? decodeString(listingData.listing.contact.address)
                        : user.address
                        ? decodeString(user.address)
                        : "",
                      phone: listingData.listing.contact.phone
                        ? listingData.listing.contact.phone
                        : user.phone
                        ? user.phone
                        : "",
                      whatsapp_number: listingData.listing.contact
                        .whatsapp_number
                        ? listingData.listing.contact.whatsapp_number
                        : user.whatsapp_number
                        ? user.whatsapp_number
                        : "",
                      email: listingData.listing.contact.email
                        ? listingData.listing.contact.email
                        : user.email
                        ? user.email
                        : "",
                      website: listingData.listing.contact.website
                        ? listingData.listing.contact.website
                        : user.website
                        ? user.website
                        : "",
                      video_urls: listingData?.listing?.video_urls
                        ? listingData?.listing?.video_urls[0]
                        : "" || "",
                    }}
                    onSubmit={handleUpdateListing}
                    validationSchema={validationSchema}
                  >
                    {({
                      handleChange,
                      handleBlur,
                      handleSubmit,
                      values,
                      errors,
                      touched,
                      setFieldTouched,
                      setFieldValue,
                    }) => (
                      <View>
                        {/* Common Fields (Title, Pricing Type, Price Type, Price) */}
                        <View style={styles.commonFieldsWrap}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingHorizontal: "3%",
                            }}
                          >
                            <View style={styles.iconWrap}>
                              <Image
                                style={{
                                  height: 25,
                                  width: 25,
                                  resizeMode: "contain",
                                }}
                                source={require("../assets/product_info_icon.png")}
                              />
                            </View>
                            <Text style={styles.title}>
                              {__(
                                "editListingScreenTexts.formFieldLabels.formTitle",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <AppSeparator
                            style={{
                              marginVertical: 20,
                              width: "94%",
                              marginHorizontal: "3%",
                            }}
                          />
                          <View style={styles.commonInputWrap}>
                            <Text style={styles.commonInputLabel}>
                              {__(
                                "editListingScreenTexts.formFieldLabels.listingTitle",
                                appSettings.lng
                              )}
                              <Text style={styles.required}> *</Text>
                            </Text>
                            <TextInput
                              style={styles.commonInputField}
                              onChangeText={handleChange("title")}
                              onBlur={() => setFieldTouched("title")}
                              value={values.title}
                            />
                            <View style={styles.inputFieldErrorWrap}>
                              {errors.title && touched.title && (
                                <Text style={styles.inputFieldErrorMessage}>
                                  {errors.title}
                                </Text>
                              )}
                            </View>
                          </View>

                          {!listingData.config.hidden_fields.includes(
                            "pricing_type"
                          ) &&
                            listingData?.config?.pricing_types && (
                              <View style={styles.commonInputWrap}>
                                <Text style={styles.commonInputLabel}>
                                  {__(
                                    "editListingScreenTexts.formFieldLabels.pricingLabel",
                                    appSettings.lng
                                  )}
                                  <Text style={styles.required}> *</Text>
                                </Text>
                                <View style={styles.priceTypePickerWrap}>
                                  <AppRadioButton
                                    field={listingData.config.pricing_types}
                                    handleClick={updatePricingType}
                                    selected={listingCommonData.pricing_type}
                                  />
                                </View>

                                <View style={styles.inputFieldErrorWrap}>
                                  {!listingCommonData.pricing_type && (
                                    <Text style={styles.inputFieldErrorMessage}>
                                      {__(
                                        "editListingScreenTexts.requiredFieldCustomError",
                                        appSettings.lng
                                      )}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            )}
                          {!listingData.config.hidden_fields.includes(
                            "price_type"
                          ) &&
                            listingCommonData.pricing_type !== "disabled" && (
                              <View style={styles.commonInputWrap}>
                                <Text style={styles.commonInputLabel}>
                                  {__(
                                    "editListingScreenTexts.formFieldLabels.priceType",
                                    appSettings.lng
                                  )}
                                  <Text style={styles.required}> *</Text>
                                </Text>
                                <View style={styles.priceTypePickerWrap}>
                                  <AppRadioButton
                                    field={listingData.config.price_types}
                                    handleClick={updatePriceType}
                                    selected={listingCommonData.price_type}
                                  />
                                </View>

                                <View style={styles.inputFieldErrorWrap}>
                                  {!listingCommonData.price_type && (
                                    <Text style={styles.inputFieldErrorMessage}>
                                      {__(
                                        "editListingScreenTexts.requiredFieldCustomError",
                                        appSettings.lng
                                      )}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            )}
                          {!listingData.config.hidden_fields.includes(
                            "price"
                          ) &&
                            listingCommonData.price_type !== "on_call" &&
                            listingCommonData.pricing_type !== "disabled" && (
                              <>
                                {listingCommonData.pricing_type !== "range" ||
                                listingData.config.hidden_fields.includes(
                                  "pricing_type"
                                ) ? (
                                  <View style={styles.commonInputWrap}>
                                    <Text style={styles.commonInputLabel}>
                                      {`${__(
                                        "editListingScreenTexts.formFieldLabels.price",
                                        appSettings.lng
                                      )} (${getCurrencySymbol(
                                        config.currency
                                      )})`}
                                      {listingCommonData.price_type !==
                                        "on_call" && (
                                        <Text style={styles.required}> *</Text>
                                      )}
                                    </Text>
                                    <TextInput
                                      style={styles.commonInputField}
                                      onChangeText={(value) => {
                                        setListingCommonData(
                                          (listingCommonData) => {
                                            return {
                                              ...listingCommonData,
                                              ["price"]: value,
                                            };
                                          }
                                        );
                                      }}
                                      onBlur={() => {
                                        setTouchedFields((prevTouchedFields) =>
                                          Array.from(
                                            new Set([
                                              ...prevTouchedFields,
                                              "price",
                                            ])
                                          )
                                        );
                                      }}
                                      value={listingCommonData.price}
                                      keyboardType="decimal-pad"
                                    />
                                    <View style={styles.inputFieldErrorWrap}>
                                      {commonErrorFields.includes("price") && (
                                        <Text
                                          style={styles.inputFieldErrorMessage}
                                        >
                                          {__(
                                            "editListingScreenTexts.requiredFieldCustomError",
                                            appSettings.lng
                                          )}
                                        </Text>
                                      )}
                                    </View>
                                  </View>
                                ) : (
                                  <View
                                    style={[
                                      styles.commonInputWrap,
                                      {
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                      },
                                    ]}
                                  >
                                    <View style={{ width: "48.5%" }}>
                                      <Text style={styles.commonInputLabel}>
                                        {`${__(
                                          "editListingScreenTexts.formFieldLabels.price",
                                          appSettings.lng
                                        )} (${getCurrencySymbol(
                                          config.currency
                                        )})`}
                                        {listingCommonData.price_type !==
                                          "on_call" && (
                                          <Text style={styles.required}>
                                            {" "}
                                            *
                                          </Text>
                                        )}
                                      </Text>
                                      <TextInput
                                        style={styles.commonInputField}
                                        onChangeText={(value) => {
                                          setListingCommonData(
                                            (listingCommonData) => {
                                              return {
                                                ...listingCommonData,
                                                ["price"]: value,
                                              };
                                            }
                                          );
                                        }}
                                        onBlur={() => {
                                          setTouchedFields(
                                            (prevTouchedFields) =>
                                              Array.from(
                                                new Set([
                                                  ...prevTouchedFields,
                                                  "price",
                                                ])
                                              )
                                          );
                                        }}
                                        value={listingCommonData.price}
                                        keyboardType="decimal-pad"
                                      />
                                      <View style={styles.inputFieldErrorWrap}>
                                        {commonErrorFields.includes(
                                          "price"
                                        ) && (
                                          <Text
                                            style={
                                              styles.inputFieldErrorMessage
                                            }
                                          >
                                            {__(
                                              "editListingScreenTexts.requiredFieldCustomError",
                                              appSettings.lng
                                            )}
                                          </Text>
                                        )}
                                      </View>
                                    </View>

                                    <View style={{ width: "48.5%" }}>
                                      <Text style={styles.commonInputLabel}>
                                        {`${__(
                                          "editListingScreenTexts.formFieldLabels.maxPrice",
                                          appSettings.lng
                                        )} (${getCurrencySymbol(
                                          config.currency
                                        )})`}
                                        {listingCommonData.price_type !==
                                          "on_call" &&
                                          listingCommonData.pricing_type ===
                                            "range" && (
                                            <Text style={styles.required}>
                                              {" "}
                                              *
                                            </Text>
                                          )}
                                      </Text>
                                      <TextInput
                                        style={styles.commonInputField}
                                        onChangeText={(value) => {
                                          setListingCommonData(
                                            (listingCommonData) => {
                                              return {
                                                ...listingCommonData,
                                                ["max_price"]: value,
                                              };
                                            }
                                          );
                                        }}
                                        onBlur={() => {
                                          setTouchedFields(
                                            (prevTouchedFields) =>
                                              Array.from(
                                                new Set([
                                                  ...prevTouchedFields,
                                                  "max_price",
                                                ])
                                              )
                                          );
                                        }}
                                        value={listingCommonData.max_price}
                                        keyboardType="decimal-pad"
                                      />
                                      <View style={styles.inputFieldErrorWrap}>
                                        {commonErrorFields.includes(
                                          "max_price"
                                        ) && (
                                          <Text
                                            style={
                                              styles.inputFieldErrorMessage
                                            }
                                          >
                                            {__(
                                              "editListingScreenTexts.requiredFieldCustomError",
                                              appSettings.lng
                                            )}
                                          </Text>
                                        )}
                                      </View>
                                    </View>
                                  </View>
                                )}
                              </>
                            )}
                        </View>
                        {/* Custom Fields */}
                        {listingData.custom_fields && (
                          <View style={styles.customFieldsWrap}>
                            {listingData.custom_fields.map((field) => (
                              <View
                                key={field.meta_key}
                                style={styles.metaField}
                              >
                                {validateCfDependency.includes(field.id) && (
                                  <>
                                    <Text style={styles.label}>
                                      {decodeString(field.label)}
                                      {field.required && (
                                        <Text style={styles.required}> *</Text>
                                      )}
                                    </Text>
                                    {[
                                      "text",
                                      "textarea",
                                      "url",
                                      "number",
                                    ].includes(field.type) && (
                                      <TextInput
                                        style={
                                          field.type === "textarea"
                                            ? styles.metaField_TextArea
                                            : styles.metaField_Text
                                        }
                                        onChangeText={(value) =>
                                          handleTextData(field.meta_key, value)
                                        }
                                        value={
                                          listingCustomData[field.meta_key]
                                            ? listingCustomData[field.meta_key]
                                            : ""
                                        }
                                        textAlignVertical={
                                          field.type === "textarea"
                                            ? "top"
                                            : "auto"
                                        }
                                        multiline={field.type === "textarea"}
                                        keyboardType={
                                          field.type === "number"
                                            ? "decimal-pad"
                                            : "default"
                                        }
                                        contextMenuHidden={
                                          field.type === "number"
                                        }
                                        placeholder={field.placeholder}
                                        onBlur={() =>
                                          setTouchedFields(
                                            (prevTouchedFields) =>
                                              Array.from(
                                                new Set([
                                                  ...prevTouchedFields,
                                                  field.meta_key,
                                                ])
                                              )
                                          )
                                        }
                                      />
                                    )}
                                    {field.type === "select" && (
                                      <View style={styles.dynamicPickerWrap}>
                                        <DynamicListPicker
                                          field={field}
                                          onselect={(item) =>
                                            setListingCustomData(
                                              (listingCustomData) => {
                                                return {
                                                  ...listingCustomData,
                                                  [field.meta_key]: item.id,
                                                };
                                              }
                                            )
                                          }
                                          selected={
                                            field.value
                                              ? field.value
                                              : undefined
                                          }
                                          handleTouch={() =>
                                            setTouchedFields(
                                              (prevTouchedFields) =>
                                                Array.from(
                                                  new Set([
                                                    ...prevTouchedFields,
                                                    field.meta_key,
                                                  ])
                                                )
                                            )
                                          }
                                        />
                                      </View>
                                    )}
                                    {field.type === "radio" && (
                                      <View style={styles.dynamicRadioWrap}>
                                        <DynamicRadioButton
                                          field={field}
                                          handleClick={(item) => {
                                            setListingCustomData(
                                              (listingCustomData) => {
                                                return {
                                                  ...listingCustomData,
                                                  [field.meta_key]: item.id,
                                                };
                                              }
                                            );
                                            setTouchedFields(
                                              (prevTouchedFields) =>
                                                Array.from(
                                                  new Set([
                                                    ...prevTouchedFields,
                                                    field.meta_key,
                                                  ])
                                                )
                                            );
                                          }}
                                          selected={
                                            listingCustomData[
                                              `${field.meta_key}`
                                            ]
                                          }
                                        />
                                      </View>
                                    )}
                                    {field.type === "checkbox" && (
                                      <View style={styles.dynamicCheckboxWrap}>
                                        <DynamicCheckbox
                                          field={field}
                                          handleClick={(value) => {
                                            setListingCustomData(
                                              (listingCustomData) => {
                                                return {
                                                  ...listingCustomData,
                                                  [field.meta_key]: value,
                                                };
                                              }
                                            );
                                            setTouchedFields(
                                              (prevTouchedFields) =>
                                                Array.from(
                                                  new Set([
                                                    ...prevTouchedFields,
                                                    field.meta_key,
                                                  ])
                                                )
                                            );
                                          }}
                                          selected={
                                            field.value.length
                                              ? field.value
                                              : []
                                          }
                                        />
                                      </View>
                                    )}
                                    {field.type === "date" && (
                                      <View style={styles.dateFieldWrap}>
                                        {["date", "date_time"].includes(
                                          field.date.type
                                        ) && (
                                          <DatePicker
                                            field={field}
                                            onSelect={handleDateTime}
                                            value={
                                              listingCustomData[field.meta_key]
                                                ? listingCustomData[
                                                    field.meta_key
                                                  ]
                                                : null
                                            }
                                          />
                                        )}
                                        {[
                                          "date_range",
                                          "date_time_range",
                                        ].includes(field.date.type) && (
                                          <DateRangePicker
                                            field={field}
                                            value={
                                              !!listingCustomData[
                                                field.meta_key
                                              ][0] ||
                                              !!listingCustomData[
                                                field.meta_key
                                              ][1]
                                                ? listingCustomData[
                                                    field.meta_key
                                                  ]
                                                : null
                                            }
                                            onSelect={handleDateTimeRange}
                                          />
                                        )}
                                      </View>
                                    )}
                                    <View style={styles.inputFieldErrorWrap}>
                                      {customErrorFields.includes(field) &&
                                        touchedFields.includes(
                                          field.meta_key
                                        ) && (
                                          <Text
                                            style={
                                              styles.inputFieldErrorMessage
                                            }
                                          >
                                            {__(
                                              "editListingScreenTexts.requiredFieldCustomError",
                                              appSettings.lng
                                            )}
                                          </Text>
                                        )}
                                    </View>
                                  </>
                                )}
                              </View>
                            ))}
                          </View>
                        )}
                        {/* Common Fields (Video Url & Description) */}
                        <View style={styles.commonFieldsWrap}>
                          {!!listingData?.config?.video_urls && (
                            <View style={styles.commonInputWrap}>
                              <Text style={styles.commonInputLabel}>
                                {__(
                                  "editListingScreenTexts.formFieldLabels.videoUrl",
                                  appSettings.lng
                                )}
                              </Text>
                              <TextInput
                                style={styles.metaField_Text}
                                onChangeText={handleChange("video_urls")}
                                onBlur={handleBlur("video_urls")}
                                value={values.video_urls}
                                placeholder={__(
                                  "editListingScreenTexts.formFieldLabels.videoUrl",
                                  appSettings.lng
                                )}
                              />
                              <Text style={styles.Text}>
                                {__(
                                  "editListingScreenTexts.videoUrlNote",
                                  appSettings.lng
                                )}
                              </Text>
                              <View style={styles.inputFieldErrorWrap}>
                                {errors.video_urls && touched.video_urls && (
                                  <Text style={styles.inputFieldErrorMessage}>
                                    {errors.video_urls}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )}
                          {!listingData.config.hidden_fields.includes(
                            "description"
                          ) && (
                            <View style={styles.commonInputWrap}>
                              <Text style={styles.commonInputLabel}>
                                {__(
                                  "editListingScreenTexts.formFieldLabels.listingDescription",
                                  appSettings.lng
                                )}
                              </Text>
                              <TextInput
                                style={styles.metaField_TextArea}
                                onChangeText={handleChange("description")}
                                onBlur={handleBlur("description")}
                                value={values.description}
                                textAlignVertical="top"
                                multiline
                                placeholder={__(
                                  "editListingScreenTexts.formFieldLabels.listingDescription",
                                  appSettings.lng
                                )}
                              />
                              <View style={styles.inputFieldErrorWrap}>
                                {errors.description && touched.description && (
                                  <Text style={styles.inputFieldErrorMessage}>
                                    {errors.price}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )}
                        </View>
                        {/* Contact Section */}
                        <View style={styles.contactSectionWrap}>
                          <View style={styles.contactTitleWrap}>
                            <View style={styles.iconWrap}>
                              <Image
                                style={{
                                  height: 25,
                                  width: 25,
                                  resizeMode: "contain",
                                }}
                                source={require("../assets/my_profile.png")}
                              />
                            </View>
                            <Text style={styles.title}>
                              {__(
                                "editListingScreenTexts.formFieldLabels.contact",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          {/* Name Input */}
                          {!listingData.config.hidden_fields.includes(
                            "name"
                          ) && (
                            <View style={styles.commonInputWrap}>
                              <Text style={styles.commonInputLabel}>
                                {__(
                                  "editListingScreenTexts.formFieldLabels.name",
                                  appSettings.lng
                                )}
                                <Text style={styles.required}> *</Text>
                              </Text>
                              <TextInput
                                style={styles.commonInputField}
                                onChangeText={handleChange("name")}
                                onBlur={handleBlur("name")}
                                value={values.name}
                                editable={!user.first_name && !user.last_name}
                              />
                              <View style={styles.inputFieldErrorWrap}>
                                {errors.name && touched.name && (
                                  <Text style={styles.inputFieldErrorMessage}>
                                    {errors.name}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )}
                          {/* Phone Input */}
                          {!listingData.config.hidden_fields.includes(
                            "phone"
                          ) && (
                            <View style={styles.commonInputWrap}>
                              <Text style={styles.commonInputLabel}>
                                {__(
                                  "editListingScreenTexts.formFieldLabels.phone",
                                  appSettings.lng
                                )}
                                <Text style={styles.required}> *</Text>
                              </Text>
                              <TextInput
                                style={styles.commonInputField}
                                onChangeText={handleChange("phone")}
                                onBlur={handleBlur("phone")}
                                value={values.phone}
                              />
                              <View style={styles.inputFieldErrorWrap}>
                                {errors.phone && touched.phone && (
                                  <Text style={styles.inputFieldErrorMessage}>
                                    {errors.phone}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )}
                          {/* Whatsapp Input */}
                          {!listingData.config.hidden_fields.includes(
                            "whatsapp_number"
                          ) && (
                            <View style={styles.commonInputWrap}>
                              <Text style={styles.commonInputLabel}>
                                {__(
                                  "editListingScreenTexts.formFieldLabels.whatsapp",
                                  appSettings.lng
                                )}
                              </Text>
                              <TextInput
                                style={styles.commonInputField}
                                onChangeText={handleChange("whatsapp_number")}
                                onBlur={handleBlur("whatsapp_number")}
                                value={values.whatsapp_number}
                              />
                              <Text style={styles.Text}>
                                {__(
                                  "editListingScreenTexts.whatsappNote",
                                  appSettings.lng
                                )}
                              </Text>
                              <View style={styles.inputFieldErrorWrap}>
                                {errors.whatsapp_number &&
                                  touched.whatsapp_number && (
                                    <Text style={styles.inputFieldErrorMessage}>
                                      {errors.whatsapp_number}
                                    </Text>
                                  )}
                              </View>
                            </View>
                          )}
                          {/* Email Input */}
                          {!listingData.config.hidden_fields.includes(
                            "email"
                          ) && (
                            <View style={styles.commonInputWrap}>
                              <Text style={styles.commonInputLabel}>
                                {__(
                                  "editListingScreenTexts.formFieldLabels.email",
                                  appSettings.lng
                                )}
                                <Text style={styles.required}> *</Text>
                              </Text>
                              <TextInput
                                style={styles.commonInputField}
                                onChangeText={handleChange("email")}
                                onBlur={handleBlur("email")}
                                value={values.email}
                                editable={!values.email}
                              />
                              <View style={styles.inputFieldErrorWrap}>
                                {errors.email && touched.email && (
                                  <Text style={styles.inputFieldErrorMessage}>
                                    {errors.email}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )}
                          {/* Website Input */}
                          {!listingData.config.hidden_fields.includes(
                            "website"
                          ) && (
                            <View style={styles.commonInputWrap}>
                              <Text style={styles.commonInputLabel}>
                                {__(
                                  "editListingScreenTexts.formFieldLabels.website",
                                  appSettings.lng
                                )}
                              </Text>
                              <TextInput
                                style={styles.commonInputField}
                                onChangeText={handleChange("website")}
                                onBlur={handleBlur("website")}
                                value={values.website}
                              />
                              <View style={styles.inputFieldErrorWrap}>
                                {errors.website && touched.website && (
                                  <Text style={styles.inputFieldErrorMessage}>
                                    {errors.website}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )}
                          {/* ZipCode Input */}
                          {!listingData.config.hidden_fields.includes(
                            "zipcode"
                          ) &&
                            config.location_type === "local" && (
                              <View style={styles.commonInputWrap}>
                                <Text style={styles.commonInputLabel}>
                                  {__(
                                    "editListingScreenTexts.formFieldLabels.zipCode",
                                    appSettings.lng
                                  )}
                                </Text>
                                <TextInput
                                  style={styles.commonInputField}
                                  onChangeText={(text) => {
                                    setFieldValue("zipcode", text);
                                    if (!geoCoderFail) {
                                      handleReGeocoding(values, {
                                        zipcode: text,
                                      });
                                    }
                                  }}
                                  onBlur={handleBlur("zipcode")}
                                  value={values.zipcode}
                                />
                                <View style={styles.inputFieldErrorWrap}>
                                  {errors.zipcode && touched.zipcode && (
                                    <Text style={styles.inputFieldErrorMessage}>
                                      {errors.zipcode}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            )}
                          {/* Address Input */}
                          {!listingData.config.hidden_fields.includes(
                            "address"
                          ) &&
                            config.location_type === "local" && (
                              <View style={styles.commonInputWrap}>
                                <Text style={styles.commonInputLabel}>
                                  {__(
                                    "editListingScreenTexts.formFieldLabels.address",
                                    appSettings.lng
                                  )}
                                </Text>
                                <TextInput
                                  style={styles.commonInputField}
                                  onChangeText={(text) => {
                                    setFieldValue("address", text);
                                    if (!geoCoderFail) {
                                      handleReGeocoding(values, {
                                        address: text,
                                      });
                                    }
                                  }}
                                  onBlur={handleBlur("address")}
                                  value={values.address}
                                  placeholder={__(
                                    "editListingScreenTexts.formFieldLabels.address",
                                    appSettings.lng
                                  )}
                                />
                                <View style={styles.inputFieldErrorWrap}>
                                  {errors.address && touched.address && (
                                    <Text style={styles.inputFieldErrorMessage}>
                                      {errors.address}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            )}
                          {/* Google Address Component */}
                          {config.location_type === "google" && !geoCoderFail && (
                            <View style={styles.commonInputWrap}>
                              <Text style={styles.commonInputLabel}>
                                {__(
                                  "editListingScreenTexts.formFieldLabels.address",
                                  appSettings.lng
                                )}
                              </Text>

                              <GooglePlacesAutocomplete
                                placeholder={
                                  listingGeoAddress
                                    ? listingGeoAddress
                                    : "Search Address"
                                }
                                textInputProps={{
                                  placeholderTextColor: listingGeoAddress
                                    ? COLORS.black
                                    : "#b6b6b6",
                                }}
                                onPress={(data, details = null) => {
                                  if (data.description) {
                                    setListingGeoAddress(
                                      (prevListingGeoAddress) =>
                                        data.description
                                    );
                                  }
                                  if (details.geometry.location) {
                                    const geoLocation = {
                                      latitude: details.geometry.location.lat,
                                      longitude: details.geometry.location.lng,
                                    };
                                    setRegion((prevRegion) => {
                                      return { ...geoLocation };
                                    });
                                    setMarkerPosition(
                                      (prevListingGeoAddress) => {
                                        return { ...geoLocation };
                                      }
                                    );
                                  }
                                }}
                                fetchDetails={true}
                                query={{
                                  key: config.map.api_key,
                                  language: "en",
                                }}
                                debounce={200}
                                timeout={15000} //15 seconds
                              />

                              <View style={styles.inputFieldErrorWrap}>
                                {errors.address && touched.address && (
                                  <Text style={styles.inputFieldErrorMessage}>
                                    {errors.address}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )}
                        </View>
                        {/* MapView */}
                        {config.map && (
                          <View>
                            {geoCoderFail ? (
                              <View
                                style={{
                                  marginHorizontal: "3%",
                                }}
                              >
                                <View style={styles.geoCoderFailWrap}>
                                  <Text style={styles.geoCoderFailTitle}>
                                    {__(
                                      "editListingScreenTexts.geoCoderFail",
                                      appSettings.lng
                                    )}
                                  </Text>
                                  <Text style={styles.geoCoderFailMessage}>
                                    {geoCoderFailedMessage}
                                  </Text>
                                </View>
                              </View>
                            ) : (
                              <>
                                {/* Loading Component Inside Map */}
                                {locationLoading && (
                                  <View style={styles.mapOverlay}>
                                    <ActivityIndicator
                                      size="large"
                                      color={COLORS.primary}
                                    />
                                  </View>
                                )}
                                {/* Map Mode Toggle Button */}
                                <View style={styles.mapViewButtonsWrap}>
                                  <TouchableOpacity
                                    style={[
                                      styles.mapViewButton,
                                      {
                                        backgroundColor:
                                          mapType == "standard"
                                            ? COLORS.dodgerblue
                                            : "transparent",
                                      },
                                    ]}
                                    onPress={handleMapTypeChange}
                                    disabled={mapType == "standard"}
                                  >
                                    <Text
                                      style={[
                                        styles.mapViewButtonTitle,
                                        {
                                          color:
                                            mapType == "standard"
                                              ? COLORS.white
                                              : COLORS.text_gray,
                                        },
                                      ]}
                                    >
                                      {__(
                                        "editListingScreenTexts.buttonTitles.mapStandard",
                                        appSettings.lng
                                      )}
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[
                                      styles.mapViewButton,
                                      {
                                        backgroundColor:
                                          mapType == "hybrid"
                                            ? COLORS.dodgerblue
                                            : "transparent",
                                      },
                                    ]}
                                    onPress={handleMapTypeChange}
                                    disabled={mapType == "hybrid"}
                                  >
                                    <Text
                                      style={[
                                        styles.mapViewButtonTitle,
                                        {
                                          color:
                                            mapType == "hybrid"
                                              ? COLORS.white
                                              : COLORS.text_gray,
                                        },
                                      ]}
                                    >
                                      {__(
                                        "editListingScreenTexts.buttonTitles.mapHybrid",
                                        appSettings.lng
                                      )}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                                {/* Map Component */}
                                <MapView
                                  ref={mapViewRef}
                                  style={{
                                    width: screenWidth,
                                    height: screenWidth * 0.8,
                                  }}
                                  region={{
                                    ...region,
                                    latitudeDelta: 0.0135135,
                                    longitudeDelta: 0.0135135 * 0.8,
                                  }}
                                  provider={MapView.PROVIDER_GOOGLE}
                                  mapType={mapType}
                                  loadingEnabled={true}
                                  loadingIndicatorColor={COLORS.primary_soft}
                                  loadingBackgroundColor={COLORS.white}
                                >
                                  <Marker
                                    coordinate={markerPosition}
                                    draggable
                                    onDragEnd={(event) =>
                                      handleMarkerReleaseEvent(
                                        event.nativeEvent.coordinate,
                                        setFieldValue
                                      )
                                    }
                                  />
                                </MapView>
                                {/* Hide Map Toggle */}
                                <View style={styles.mapDisplayInputWrap}>
                                  <TouchableWithoutFeedback
                                    onPress={() =>
                                      setHideMap((prevHideMap) => !prevHideMap)
                                    }
                                  >
                                    <View style={styles.mapCheckboxWrap}>
                                      <MaterialCommunityIcons
                                        name={
                                          hideMap
                                            ? "checkbox-marked"
                                            : "checkbox-blank-outline"
                                        }
                                        size={20}
                                        color={COLORS.primary}
                                      />
                                      <Text style={styles.mapToggleMessage}>
                                        {__(
                                          "editListingScreenTexts.mapToggleMessage",
                                          appSettings.lng
                                        )}
                                      </Text>
                                    </View>
                                  </TouchableWithoutFeedback>
                                </View>
                                {/* Device Location Button */}
                                <TouchableOpacity
                                  style={[
                                    styles.deviceLocationButton,
                                    ios
                                      ? {
                                          shadowColor: "#000",
                                          shadowRadius: 4,
                                          shadowOpacity: 0.2,
                                          shadowOffset: {
                                            height: 2,
                                            width: 2,
                                          },
                                        }
                                      : { elevation: 1 },
                                  ]}
                                  onPress={() =>
                                    handleGetDeviceLocation(setFieldValue)
                                  }
                                  disabled={locationLoading}
                                >
                                  <MaterialIcons
                                    name="my-location"
                                    size={24}
                                    color={
                                      locationLoading
                                        ? COLORS.primary_soft
                                        : COLORS.primary
                                    }
                                  />
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        )}
                        {/* Bottom notes */}
                        <View style={[styles.noteWrap]}>
                          <Text
                            style={[
                              styles.text,
                              {
                                color:
                                  Object.keys(errors).length ||
                                  customErrorFields.length ||
                                  commonErrorFields.length
                                    ? COLORS.red
                                    : COLORS.text_gray,
                              },
                            ]}
                          >
                            {__(
                              "editListingScreenTexts.requiredFieldNotice",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        {/* Submit Button Component */}
                        <View style={{ paddingHorizontal: "3%" }}>
                          <AppButton
                            style={styles.updateButton}
                            title={__(
                              "editListingScreenTexts.buttonTitles.updateListing",
                              appSettings.lng
                            )}
                            onPress={handleSubmit}
                            loading={updateLoading}
                            disabled={
                              updateLoading ||
                              Object.keys(errors).length ||
                              customErrorFields.length ||
                              commonErrorFields.length
                            }
                          />
                        </View>
                      </View>
                    )}
                  </Formik>
                </View>
              </View>
            </View>
          </ScrollView>
        ))}
    </>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 20,
  },
  commonInputField: {
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 3,
    paddingHorizontal: 5,
    minHeight: 32,
  },
  commonInputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text_gray,
    marginBottom: 5,
  },
  commonInputWrap: {
    paddingHorizontal: "3%",
  },
  contactTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: "3%",
  },
  container: {
    // flex: 1,
  },
  deviceLocationButton: {
    height: 40,
    width: 40,
    borderRadius: 40 / 2,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 40 * 0.25,
    top: screenWidth * 0.8 - 40 * 1.25,
    zIndex: 1,
  },
  flashMessage_success: {
    position: "absolute",
    backgroundColor: "green",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    bottom: 0,
    zIndex: 2,
  },
  flashMessage_error: {
    position: "absolute",
    backgroundColor: "red",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    bottom: 0,
    zIndex: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text_gray,
    marginVertical: 15,
  },
  geoCoderFailMessage: {
    color: COLORS.red,
  },
  geoCoderFailTitle: {
    marginBottom: 20,
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  geoCoderFailWrap: {
    padding: "3%",
    alignItems: "center",
    width: screenWidth * 0.94,
    height: screenWidth * 0.6,
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 3,
    justifyContent: "center",
    marginBottom: 10,
  },
  imageInputLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text_gray,
    marginLeft: 10,
  },
  imageInputNotes: {
    backgroundColor: "#ffe4d2",

    borderRadius: 3,
    marginTop: 10,
    padding: 10,
  },
  imageInputNotesText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#f60",
  },
  imageInputTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "3%",
  },
  imageInputWrap: {
    // marginBottom: 15,
  },
  inputFieldErrorMessage: {
    color: COLORS.red,
    fontSize: 12,
  },
  inputFieldErrorWrap: {
    minHeight: 17,
  },
  iconWrap: {
    height: 25,
    width: 25,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text_gray,
    marginBottom: 5,
  },
  loading: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    flex: 1,
  },
  location1Picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 3,
    height: 32,
  },
  mainWrap: {
    backgroundColor: COLORS.white,
  },
  mapCheckboxWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  mapDisplayInputWrap: {
    paddingHorizontal: "3%",
  },
  mapOverlay: {
    height: screenWidth * 0.8,
    width: "100%",
    backgroundColor: "rgba(0,0,0,.2)",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  mapToggleMessage: {
    paddingLeft: 5,
  },
  mapViewButton: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
  mapViewButtonTitle: {
    textTransform: "capitalize",
    fontSize: 12,
    fontWeight: "bold",
  },
  mapViewButtonsWrap: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 5,
    right: 10,
    zIndex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 5,
  },
  metaField: {
    // marginVertical: 10,
    paddingHorizontal: "3%",
  },
  metaField_Text: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 3,
    paddingHorizontal: 5,
    minHeight: 32,
  },
  metaField_TextArea: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 3,
    minHeight: 70,
    paddingHorizontal: 5,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  modalText: {
    fontSize: 17,
    paddingBottom: 12,
  },
  modalView: {
    width: "94%",
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
  },
  noteWrap: {
    alignItems: "center",
    paddingHorizontal: "3%",
  },
  pickerOptions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  pickerOptionsText: {
    fontSize: 16,
    color: COLORS.text_dark,
    textTransform: "capitalize",
    flex: 1,
  },
  priceTypePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 3,
    height: 32,
  },
  required: {
    color: "#ff6600",
  },
  separator: {
    width: "100%",
    backgroundColor: COLORS.bg_dark,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text_gray,
    paddingHorizontal: "3%",
  },
  titleWrap: {
    backgroundColor: COLORS.white,
    alignItems: "center",
  },
  updateButton: {
    borderRadius: 3,
    marginVertical: 20,
  },
});

export default EditListingScreen;
