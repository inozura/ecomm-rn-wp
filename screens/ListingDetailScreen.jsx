/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";

// External Libraries
import moment from "moment";
import ReadMore from "react-native-read-more-text";
import ReactNativeZoomableView from "@dudigital/react-native-zoomable-view/src/ReactNativeZoomableView";
import MapView, { Marker } from "react-native-maps";
import YoutubePlayer from "react-native-youtube-iframe";

// Vector Icons
import { FontAwesome5 } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";

// Custom Components & Constants
import ListingHeader from "../components/ListingHeader";
import { COLORS } from "../variables/color";
import AppSeparator from "../components/AppSeparator";
import SimilarAdFlatList from "../components/SimilarAdFlatList";
import SellerContact from "../components/SellerContact";
import { useStateValue } from "../StateProvider";
import api, { setAuthToken, removeAuthToken } from "../api/client";
import { getPrice, decodeString } from "../helper/helper";
import Badge from "../components/Badge";
import AppTextButton from "../components/AppTextButton";
import { __ } from "../language/stringPicker";

const { width: windowWidth, height: windowHeight } = Dimensions.get("window");
const { height: screenHeight } = Dimensions.get("screen");

const listingDetailScreenTexts = {
  loadingText: "Getting listing data",
  soldOutMessage: "Sold out",
  cancelButtonTitle: "Cancel",
  loginButtonTitle: "Login",
  pageTitle: "Details",
  showLess: "Show Less",
  showMore: "Show More",
  sellerPrefix: "For sale by ",
  description: "Description",
  mapButtons: {
    standard: "Standard",
    hybrid: "Hybrid",
  },
  reportAd: "Report this ad",
  similar: "Similar Ads",
  call: "Call ",
  custom_fields: {
    date_range: {
      start: "Start : ",
      end: "End : ",
    },
    date_time_range: {
      start: "Start : ",
      end: "End : ",
    },
  },
  chatLoginAlert: "Please login to chat with this seller",
  emailLoginAlert: "Please login to send mail to seller",
  priceTypes: {
    fixed: "Fixed",
    onCall: "On Call",
    negotiable: "Negotiable",
  },
};

const ListingDetailScreen = ({ route, navigation }) => {
  const [{ user, auth_token, config, ios, appSettings }] = useStateValue();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [listingData, setListingData] = useState();
  const [loading, setLoading] = useState(true);
  const [favoriteDisabled, setFavoriteDisabled] = useState(false);
  const [imageViewer, setImageViewer] = useState(false);
  const [viewingImage, setViewingImage] = useState();
  const [mapType, setMapType] = useState("standard");
  const [playing, setPlaying] = useState(false);

  // Initial Get Listing Data
  useEffect(() => {
    setAuthToken(auth_token);
    api.get(`/listings/${route.params.listingId}`).then((res) => {
      console.log(res.data.max_price);
      console.log(res.data.pricing_type);
      if (res.ok) {
        setListingData(res.data);
        removeAuthToken();
        setLoading(false);
      } else {
        console.log(res.data);
        // print error
        // TODO handle error
        removeAuthToken();
        setLoading(false);
      }
    });
  }, []);

  const handleCall = (number) => {
    setModalVisible(false);
    let phoneNumber = "";
    if (ios) {
      phoneNumber = `telprompt:${number}`;
    } else {
      phoneNumber = `tel:${number}`;
    }
    Linking.openURL(phoneNumber);
  };
  const handleScroll = (e) => {
    if (playing) {
      setPlaying(false);
    }
    setCurrentSlide(Math.round(e.nativeEvent.contentOffset.x / windowWidth));
  };
  const handleChatLoginAlert = () => {
    Alert.alert(
      "",
      __("listingDetailScreenTexts.chatLoginAlert", appSettings.lng),
      [
        {
          text: __(
            "listingDetailScreenTexts.cancelButtonTitle",
            appSettings.lng
          ),
        },
        {
          text: __(
            "listingDetailScreenTexts.loginButtonTitle",
            appSettings.lng
          ),
          onPress: () => navigation.navigate("Log In"),
        },
      ],
      { cancelable: false }
    );
  };
  const handleEmailLoginAlert = () => {
    Alert.alert(
      "",
      __("listingDetailScreenTexts.emailLoginAlert", appSettings.lng),
      [
        {
          text: __(
            "listingDetailScreenTexts.cancelButtonTitle",
            appSettings.lng
          ),
        },
        {
          text: __(
            "listingDetailScreenTexts.loginButtonTitle",
            appSettings.lng
          ),
          onPress: () => navigation.navigate("Log In"),
        },
      ],
      { cancelable: false }
    );
  };
  const getLocation = (contact) => {
    let locationData;
    if (config.location_type === "local") {
      locationData =
        contact?.locations?.map((item) => item?.name).join(", ") || "";
      return contact.address
        ? locationData + ", " + decodeString(contact.address)
        : locationData;
    }
    if (config.location_type === "google") {
      return decodeString(contact?.geo_address) || "";
    }
  };
  const getPriceType = (priceType) => {
    if (priceType === "fixed") {
      return __("listingDetailScreenTexts.priceTypes.fixed", appSettings.lng);
    } else {
      return __(
        "listingDetailScreenTexts.priceTypes.negotiable",
        appSettings.lng
      );
    }
  };
  const handleFavourite = () => {
    setFavoriteDisabled((favoriteDisabled) => true);
    setAuthToken(auth_token);
    api
      .post("my/favourites", { listing_id: listingData.listing_id })
      .then((res) => {
        if (res.ok) {
          const newListingData = { ...listingData };
          newListingData.is_favourite = res.data.includes(
            listingData.listing_id
          );
          setListingData(newListingData);
          setFavoriteDisabled((favoriteDisabled) => false);
          removeAuthToken();
        } else {
          // print error
          // TODO handle error
          setFavoriteDisabled((favoriteDisabled) => false);
          removeAuthToken();
          // setLoading(false);
        }
      });
  };
  const renderTruncatedFooter = (handleDescriptionToggle) => {
    return (
      <Text
        style={{
          color: COLORS.text_gray,
          marginTop: 10,
          fontWeight: "bold",
          textAlign: "center",
        }}
        onPress={handleDescriptionToggle}
      >
        {__("listingDetailScreenTexts.showMore", appSettings.lng)}
      </Text>
    );
  };
  const renderRevealedFooter = (handleDescriptionToggle) => {
    return (
      <Text
        style={{
          color: COLORS.text_gray,
          marginTop: 10,
          fontWeight: "bold",
          textAlign: "center",
        }}
        onPress={handleDescriptionToggle}
      >
        {__("listingDetailScreenTexts.showLess", appSettings.lng)}
      </Text>
    );
  };
  const handleChat = () => {
    if (playing) {
      setPlaying(false);
    }
    const data = {
      id: listingData.listing_id,
      title: listingData.title,
      images: listingData.images,
      category: listingData.categories,
      location: listingData.contact.locations,
    };
    user !== null && user.id !== listingData.author_id
      ? navigation.navigate("Chat", { listing: data, from: "listing" })
      : handleChatLoginAlert();
  };

  const handleEmail = () => {
    if (playing) {
      setPlaying(false);
    }

    const data = {
      id: listingData.listing_id,
      title: listingData.title,
    };
    if (user !== null && user.id !== listingData.author_id) {
      navigation.navigate("Send Email", { listing: data, source: "listing" });
    } else {
      handleEmailLoginAlert();
    }
  };

  const getCheckboxValue = (field) => {
    let checkBoxValue = "";

    field.value.map((value) => {
      if (checkBoxValue.length) {
        checkBoxValue =
          checkBoxValue +
          ", " +
          field.options.choices.filter((choice) => choice.id === value)[0].name;
      } else {
        checkBoxValue =
          checkBoxValue +
          field.options.choices.filter((choice) => choice.id === value)[0].name;
      }
    });
    return decodeString(checkBoxValue);
  };

  const getSellerName = () => {
    if (!!listingData.author.first_name || !!listingData.author.last_name) {
      return decodeString(
        listingData.author.first_name + " " + listingData.author.last_name
      );
    } else {
      return decodeString(listingData.author.username);
    }
  };

  const handleImageZoomView = (image) => {
    setViewingImage(image);
    setTimeout(() => {
      setImageViewer(true);
    }, 20);
  };

  const handleImageViewerClose = () => {
    setImageViewer((prevImageViewer) => false);
  };

  const getRangeField = (field) => {
    if (!!field.value.start || !!field.value.end) {
      return true;
    } else return false;
  };

  const getAddress = (contact) => {
    if (!contact) return "";
    const address = [];
    if (config?.location_type === "local") {
      if (contact?.address) {
        address.push(contact.address);
      }
      if (contact?.zipcode) {
        address.push(contact.zipcode);
      }
      if (contact?.locations?.length) {
        contact.locations.map((loc) => {
          address.push(loc.name);
        });
      }
    } else {
      if (contact?.geo_address) {
        address.push(contact.geo_address);
      }
    }

    return address.length ? decodeString(address.join(", ")) : "";
  };

  const handleMapTypeChange = () => {
    if (mapType == "standard") {
      setMapType("hybrid");
    } else {
      setMapType("standard");
    }
  };

  const getCustomFields = () => {
    return listingData.custom_fields.filter((_field) => !!_field.value).length;
  };

  const handleStorePress = () => {
    if (playing) {
      setPlaying(false);
    }
    navigation.push("Store Details", { storeId: listingData.store.id });
  };

  const getListingTime = () => {
    return moment(listingData.created_at).format("MMM Do h:mm a");
  };

  const getTotalSlideCount = () => {
    if (!listingData?.video_urls?.length) {
      return listingData.images.length;
    }
    if (!listingData?.images?.length) {
      return listingData.video_urls.length;
    }
    return listingData.images.length + listingData.video_urls.length;
  };

  const get_sanitized_embed_url = (url) => {
    const regExp = /^https?\:\/\/(?:www\.youtube(?:\-nocookie)?\.com\/|m\.youtube\.com\/|youtube\.com\/)?(?:ytscreeningroom\?vi?=|youtu\.be\/|vi?\/|user\/.+\/u\/\w{1,2}\/|embed\/|watch\?(?:.*\&)?vi?=|\&vi?=|\?(?:.*\&)?vi?=)([^#\&\?\n\/<>"']*)/i;
    const match = url.match(regExp);
    const ytId = match && match[1].length === 11 ? match[1] : null;

    if (ytId) {
      return (
        <View key={ytId}>
          <YoutubePlayer
            height={300}
            width={windowWidth}
            play={playing}
            videoId={ytId}
            onChangeState={onStateChange}
            forceAndroidAutoplay={false}
            initialPlayerParams={{
              showClosedCaptions: false,
              // controls: false,
              loop: false,
              cc_lang_pref: "en",
              modestbranding: 1,
              rel: false,
            }}
          />
        </View>
      );
    }

    return null;
  };

  const onStateChange = useCallback((state) => {
    if (state === "playing") {
      setPlaying(true);
    }
  }, []);
  const handleReport = () => {
    if (playing) {
      setPlaying(false);
    }
    navigation.navigate("Report", {
      listingId: listingData.listing_id,
      listingTitle: listingData.title,
    });
  };

  return imageViewer ? (
    // {* Image Viewre Component *}
    <View style={styles.imageViewerWrap}>
      <TouchableOpacity
        style={styles.imageViewerCloseButton}
        onPress={handleImageViewerClose}
      >
        <FontAwesome5 name="times" size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.imageViewer}>
        <ReactNativeZoomableView
          maxZoom={2}
          minZoom={1}
          zoomStep={0.5}
          initialZoom={1}
          bindToBorders={true}
          style={{
            padding: 10,
            backgroundColor: COLORS.black,
          }}
        >
          <Image
            style={{
              width: windowWidth,
              height: windowHeight,
              resizeMode: "contain",
            }}
            source={{
              uri: viewingImage.sizes.full.src,
            }}
          />
        </ReactNativeZoomableView>
      </View>
    </View>
  ) : (
    <>
      {/* Page Header */}
      <ListingHeader
        title={__("listingDetailScreenTexts.pageTitle", appSettings.lng)}
        onBack={() => navigation.goBack()}
        onFavorite={handleFavourite}
        author={listingData ? listingData.author_id : null}
        is_favourite={listingData ? listingData.is_favourite : null}
        favoriteDisabled={favoriteDisabled}
        style={{ position: "relative" }}
      />
      {/* Loading Component */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.text}>
            {__("listingDetailScreenTexts.loadingText", appSettings.lng)}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View
            style={{
              backgroundColor: COLORS.white,
              flex: 1,
            }}
          >
            {/* Sold out badge */}
            {listingData.badges.includes("is-sold") && (
              <View
                style={[
                  styles.soldOutBadge,
                  {
                    top: !ios
                      ? screenHeight - windowHeight
                        ? "3%"
                        : "3.5%"
                      : "4%",

                    left: ios ? "73%" : "73%",
                    width: "35%",
                    // elevation: 2,
                  },
                ]}
              >
                <Text style={styles.soldOutMessage}>
                  {__(
                    "listingDetailScreenTexts.soldOutMessage",
                    appSettings.lng
                  )}
                </Text>
              </View>
            )}
            {/* main scrollview */}
            <ScrollView contentContainerStyle={styles.container}>
              {/* Media Slider */}
              {(!!listingData?.images.length ||
                !!listingData?.video_urls?.length) && (
                <View style={styles.imageSlider}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    showsHorizontalScrollIndicator={false}
                  >
                    {!!listingData?.video_urls?.length &&
                      listingData.video_urls.map((url) =>
                        get_sanitized_embed_url(url)
                      )}

                    {listingData.images.map((image) => (
                      <TouchableWithoutFeedback
                        style={styles.to}
                        key={image.ID}
                        onPress={() => handleImageZoomView(image)}
                      >
                        <Image
                          style={{
                            width: windowWidth,
                            height: 300,
                            resizeMode: "contain",
                          }}
                          source={{
                            uri: image.sizes.full.src,
                          }}
                        />
                      </TouchableWithoutFeedback>
                    ))}
                  </ScrollView>

                  {(listingData?.images?.length > 1 ||
                    listingData?.video_urls?.length > 0) && (
                    <Text style={styles.scrollProgress}>
                      {currentSlide + 1} / {getTotalSlideCount()}
                    </Text>
                  )}
                </View>
              )}

              {/* title, location, date, badges */}
              <View style={[styles.bgWhite_W100_PH3, { overflow: "hidden" }]}>
                {/* Title */}
                <Text style={styles.listingTitle}>
                  {decodeString(listingData.title)}
                </Text>

                {/* Other Badges */}
                {listingData.badges.length > 0 && (
                  <View style={styles.badgeSection}>
                    {listingData.badges.map((_badge) => (
                      <Badge badgeName={_badge} key={_badge} />
                    ))}
                  </View>
                )}
                {/* Location */}
                {!!getLocation(listingData.contact) && (
                  <View style={[styles.locationData, styles.flexRow]}>
                    <View style={styles.listingLocationAndTimeIconContainer}>
                      <FontAwesome5
                        name="map-marker-alt"
                        size={15}
                        color={COLORS.text_gray}
                      />
                    </View>
                    <Text style={styles.listingLocationAndTimeText}>
                      {getLocation(listingData.contact)}
                    </Text>
                  </View>
                )}
                {/* Date & Time */}
                <View style={[styles.listingTimeData, styles.flexRow]}>
                  <View style={styles.listingLocationAndTimeIconContainer}>
                    <FontAwesome5
                      name="clock"
                      size={15}
                      color={COLORS.text_gray}
                    />
                  </View>
                  <Text style={styles.listingLocationAndTimeText}>
                    Posted on {getListingTime()}
                  </Text>
                </View>
              </View>
              <View style={styles.screenSeparatorWrap}>
                <AppSeparator style={styles.screenSeparator} />
              </View>
              {/* price & seller */}
              <View style={styles.bgWhite_W100_PH3}>
                {/* Seller or Store */}
                {config.store_enabled && !!listingData.store ? (
                  // Store
                  <View style={styles.sellerInfo}>
                    <View style={styles.storeIcon}>
                      <Image
                        style={styles.storeIconImage}
                        source={require("../assets/store_icon.png")}
                      />
                    </View>
                    <Text style={styles.sellerWrap}>
                      {__(
                        "listingDetailScreenTexts.sellerPrefix",
                        appSettings.lng
                      )}
                      <Text style={styles.storeName} onPress={handleStorePress}>
                        {decodeString(listingData.store.title)}
                      </Text>
                    </Text>
                  </View>
                ) : (
                  // Seller
                  <View style={styles.sellerInfo}>
                    <View style={styles.sellerIcon}>
                      <FontAwesome name="user" size={18} color={COLORS.gray} />
                    </View>
                    <Text style={styles.sellerWrap}>
                      {__(
                        "listingDetailScreenTexts.sellerPrefix",
                        appSettings.lng
                      )}
                      <Text style={styles.sellerName}>{getSellerName()}</Text>
                    </Text>
                  </View>
                )}

                {/* Price */}
                {listingData.pricing_type !== "disabled" && (
                  <View style={styles.listingPriceWrap}>
                    <View style={styles.priceTag}>
                      <Text style={styles.listingPrice} numberOfLines={1}>
                        {getPrice(
                          config.currency,
                          {
                            pricing_type: listingData.pricing_type,
                            price_type: listingData.price_type,
                            price: listingData.price,
                            max_price: listingData.max_price,
                          },
                          appSettings.lng
                        )}
                      </Text>
                      <View
                        style={{
                          height: 0,
                          width: 0,
                          borderTopWidth: 30,
                          borderTopColor: "transparent",
                          borderBottomWidth: 30,
                          borderBottomColor: "transparent",
                          borderRightWidth: 30,
                          borderRightColor: COLORS.white,
                          position: "absolute",
                          right: -5,
                        }}
                      />
                    </View>

                    {listingData.price_type !== "on_call" && (
                      <Text style={styles.listingPricenegotiable}>
                        {getPriceType(listingData.price_type)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              {(!!getCustomFields() || !!listingData.description) && (
                <View style={styles.screenSeparatorWrap}>
                  <AppSeparator style={styles.screenSeparator} />
                </View>
              )}
              {/* custom fields & description */}
              {(getCustomFields() || !!listingData.description) && (
                <>
                  <View style={styles.bgWhite_W100_PH3}>
                    {/* Custom Fields */}
                    {!!listingData.custom_fields.length && (
                      <View
                        style={[
                          styles.listingCustomInfoWrap,
                          { marginTop: -3 },
                        ]}
                      >
                        {listingData.custom_fields.map((field, index) => (
                          <View key={index}>
                            {["text", "textarea"].includes(field.type) &&
                              !!field.value && (
                                <View style={styles.customfield}>
                                  <Text style={styles.customfieldName}>
                                    {decodeString(field.label)}
                                  </Text>
                                  <Text style={styles.customfieldValue}>
                                    {decodeString(field.value)}
                                  </Text>
                                </View>
                              )}
                            {["url", "number"].includes(field.type) &&
                              !!field.value && (
                                <View style={styles.customfield}>
                                  <Text style={styles.customfieldName}>
                                    {decodeString(field.label)}
                                  </Text>
                                  <Text style={styles.customfieldValue}>
                                    {field.value}
                                  </Text>
                                </View>
                              )}
                            {["radio", "select"].includes(field.type) &&
                              !!field.value &&
                              !!field.options.choices.filter(
                                (choice) => choice.id === field.value
                              ).length && (
                                <View style={styles.customfield}>
                                  <Text style={styles.customfieldName}>
                                    {decodeString(field.label)}
                                  </Text>
                                  <Text style={styles.customfieldValue}>
                                    {decodeString(
                                      field.options.choices.filter(
                                        (choice) => choice.id === field.value
                                      )[0].name
                                    )}
                                  </Text>
                                </View>
                              )}
                            {field.type === "checkbox" && !!field.value.length && (
                              <View style={styles.customfield}>
                                <Text style={styles.customfieldName}>
                                  {decodeString(field.label)}
                                </Text>
                                <Text style={styles.customfieldValue}>
                                  {getCheckboxValue(field)}
                                </Text>
                              </View>
                            )}
                            {field.type === "date" && !!field.value && (
                              <View style={styles.customfield}>
                                {["date", "date_time"].includes(
                                  field.date.type
                                ) && (
                                  <Text style={styles.customfieldName}>
                                    {decodeString(field.label)}
                                  </Text>
                                )}
                                {["date_range", "date_time_range"].includes(
                                  field.date.type
                                ) &&
                                  getRangeField(field) && (
                                    <Text style={styles.customfieldName}>
                                      {decodeString(field.label)}
                                    </Text>
                                  )}
                                {field.date.type === "date" && (
                                  <Text style={styles.customfieldValue}>
                                    {field.value}
                                  </Text>
                                )}
                                {field.date.type === "date_time" && (
                                  <Text style={styles.customfieldValue}>
                                    {field.value}
                                  </Text>
                                )}
                                {field.date.type === "date_range" &&
                                  getRangeField(field) && (
                                    <Text style={styles.customfieldValue}>
                                      {__(
                                        "listingDetailScreenTexts.custom_fields.date_range.start",
                                        appSettings.lng
                                      ) +
                                        field.value.start +
                                        "\n" +
                                        __(
                                          "listingDetailScreenTexts.custom_fields.date_range.end",
                                          appSettings.lng
                                        ) +
                                        field.value.end}
                                    </Text>
                                  )}
                                {field.date.type === "date_time_range" &&
                                  getRangeField(field) && (
                                    <Text style={styles.customfieldValue}>
                                      {__(
                                        "listingDetailScreenTexts.custom_fields.date_time_range.start",
                                        appSettings.lng
                                      ) +
                                        field.value.start +
                                        "\n" +
                                        __(
                                          "listingDetailScreenTexts.custom_fields.date_time_range.end",
                                          appSettings.lng
                                        ) +
                                        field.value.end}
                                    </Text>
                                  )}
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {!!listingData.custom_fields.length &&
                      !!listingData.description && (
                        <View
                          style={{
                            width: "100%",
                            height: 10,
                          }}
                        />
                      )}
                    {/* Description */}
                    {!!listingData.description && (
                      <View
                        style={[
                          styles.listingDescriptionWrap,
                          {
                            marginTop: !listingData.custom_fields.length
                              ? -7
                              : 0,
                          },
                        ]}
                      >
                        <Text style={styles.descriptionTitle}>
                          {__(
                            "listingDetailScreenTexts.description",
                            appSettings.lng
                          )}
                        </Text>
                        <View
                          style={{
                            backgroundColor: COLORS.bg_light,
                            borderRadius: 5,
                            paddingHorizontal: 10,
                            borderWidth: 1,
                            borderColor: COLORS.bg_dark,
                            paddingVertical: 5,
                          }}
                        >
                          <ReadMore
                            numberOfLines={3}
                            renderTruncatedFooter={renderTruncatedFooter}
                            renderRevealedFooter={renderRevealedFooter}
                          >
                            <Text style={styles.cardText}>
                              {decodeString(listingData.description).trim()}
                            </Text>
                          </ReadMore>
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={styles.screenSeparatorWrap}>
                    <AppSeparator style={styles.screenSeparator} />
                  </View>
                </>
              )}
              {/* Map Component */}
              {!listingData?.contact?.hide_map &&
                !!listingData?.contact?.latitude &&
                !!listingData?.contact?.longitude &&
                !!config?.map && (
                  <View
                    style={{
                      marginTop:
                        !!getCustomFields() || !!listingData.description
                          ? 20
                          : 0,
                      backgroundColor: COLORS.white,
                    }}
                  >
                    {/* Map Type Change Buttons */}
                    <View style={styles.mapViewButtonsWrap}>
                      {/* Standard */}
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
                            "listingDetailScreenTexts.mapButtons.standard",
                            appSettings.lng
                          )}
                        </Text>
                      </TouchableOpacity>
                      {/* Hybrid */}
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
                            "listingDetailScreenTexts.mapButtons.hybrid",
                            appSettings.lng
                          )}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {/* MapView */}
                    <MapView
                      style={{
                        width: windowWidth,
                        height: windowWidth * 0.7,
                      }}
                      initialRegion={{
                        latitude: parseFloat(
                          listingData?.contact?.latitude ||
                            config?.map?.center?.lat ||
                            0
                        ),
                        longitude: parseFloat(
                          listingData?.contact?.longitude ||
                            config?.map?.center?.lng ||
                            0
                        ),
                        latitudeDelta: 0.0135135,
                        longitudeDelta: 0.0135135 * 0.7,
                      }}
                      provider={MapView.PROVIDER_GOOGLE}
                      mapType={mapType}
                      scrollEnabled={false}
                    >
                      {/* Marker */}
                      <Marker
                        coordinate={{
                          latitude: parseFloat(
                            listingData?.contact?.latitude ||
                              config?.map?.center?.lat ||
                              0
                          ),
                          longitude: parseFloat(
                            listingData?.contact?.longitude ||
                              config?.map?.center?.lng ||
                              0
                          ),
                        }}
                        title={getAddress(listingData?.contact || {})}
                      />
                    </MapView>
                  </View>
                )}
              {/* Report ad */}
              {user !== null && user.id !== listingData.author_id && (
                <View
                  style={[styles.bgWhite_W100_PH3, { alignItems: "center" }]}
                >
                  <TouchableWithoutFeedback onPress={handleReport}>
                    <View style={styles.reportWrap}>
                      <FontAwesome5
                        name="ban"
                        size={16}
                        color={COLORS.text_gray}
                      />
                      <Text style={styles.reportText}>
                        {__(
                          "listingDetailScreenTexts.reportAd",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              )}
              {/* Similar Ads */}
              {(user === null || user.id !== listingData.author_id) &&
                listingData.related.length > 0 && (
                  <View style={styles.similarAddWrap}>
                    <View
                      style={[
                        styles.similarAddTitleWrap,
                        { paddingTop: user === null ? 15 : 0 },
                      ]}
                    >
                      <Text style={styles.similarAddTitle}>
                        {__(
                          "listingDetailScreenTexts.similar",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: "3%",
                        width: "100%",
                        marginVertical: 5,
                      }}
                    >
                      {listingData.related.map((similar) => (
                        <SimilarAdFlatList
                          key={similar.listing_id}
                          category={
                            similar.categories.length
                              ? similar.categories[0].name
                              : null
                          }
                          time={moment(similar.created_at).fromNow()}
                          title={similar.title}
                          url={
                            similar.images.length
                              ? similar.images[0].sizes.thumbnail.src
                              : null
                          }
                          views={similar.view_count}
                          id={similar.listing_id}
                          price={similar.price}
                          price_type={similar.price_type}
                          onClick={() => {
                            if (playing) {
                              setPlaying(false);
                            }
                            navigation.push("Listing Detail", {
                              listingId: similar.listing_id,
                            });
                          }}
                          item={similar}
                        />
                      ))}
                    </View>
                  </View>
                )}

              {/* Call prompt */}
              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
              >
                <TouchableWithoutFeedback
                  onPress={() => setModalVisible(false)}
                >
                  <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>
                <View
                  style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: "3%",
                      padding: 20,
                      backgroundColor: COLORS.white,
                      width: "100%",
                    }}
                  >
                    <Text style={styles.callText}>
                      {__("listingDetailScreenTexts.call", appSettings.lng)}
                      {listingData.author.first_name}{" "}
                      {listingData.author.last_name}?
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleCall(listingData.contact.phone)}
                      style={styles.phone}
                    >
                      <Text style={styles.phoneText}>
                        {listingData.contact.phone}
                      </Text>
                      <FontAwesome5
                        name="phone"
                        size={18}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                    {ios && (
                      <AppTextButton
                        title={__(
                          "listingDetailScreenTexts.cancelButtonTitle",
                          appSettings.lng
                        )}
                        style={{ marginTop: 20 }}
                        onPress={() => setModalVisible(false)}
                      />
                    )}
                  </View>
                </View>
              </Modal>
            </ScrollView>
          </View>
          {/*  Seller contact  */}
          {(user === null || user?.id !== listingData.author_id) &&
            !!listingData.contact && (
              <SellerContact
                phone={!!listingData.contact?.phone}
                email={!!listingData.contact?.email}
                onCall={() => {
                  if (playing) {
                    setPlaying(false);
                  }
                  setModalVisible(true);
                }}
                onChat={handleChat}
                onEmail={handleEmail}
              />
            )}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  badgeSection: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  bgWhite_W100_PH3: {
    backgroundColor: COLORS.white,
    paddingHorizontal: "3%",
    width: "100%",
    paddingVertical: 20,
  },
  callText: {
    fontSize: 20,
    color: COLORS.text_dark,
    textAlign: "center",
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "justify",
    color: COLORS.gray,
  },
  container: {
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  customfield: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  customfieldName: {
    width: "37%",
    fontWeight: "bold",
    fontSize: 13,
  },
  customfieldValue: {
    width: "57%",
    fontWeight: "bold",
    fontSize: 13,
    color: COLORS.text_gray,
  },
  descriptionText: {
    color: COLORS.text_gray,
    textAlign: "justify",
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text_dark,
    paddingBottom: 10,
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageSlider: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 15,
  },
  imageViewer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerCloseButton: {
    position: "absolute",
    right: 15,
    top: 15,
    zIndex: 10,
    height: 25,
    width: 25,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  imageViewerWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    width: "100%",
    height: "100%",
    flex: 1,
  },
  locationData: {
    marginBottom: 10,
  },
  listingDescriptionWrap: {},
  listingLocationAndTimeText: {
    fontSize: 15,
    color: COLORS.text_gray,
  },
  listingLocationAndTimeIconContainer: {
    alignItems: "flex-start",
    width: 25,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  listingPricenegotiable: {
    color: COLORS.text_gray,
    fontSize: 15,
    fontWeight: "bold",
  },
  listingPriceWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 5,
  },
  listingTitle: {
    color: COLORS.text_dark,
    fontSize: 20,
    fontWeight: "bold",
    paddingBottom: 10,
    marginTop: -5,
  },
  listingPriceAndOwnerWrap: {},
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
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  phone: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  phoneText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 18,
  },
  priceTag: {
    backgroundColor: COLORS.primary,
    // position: "absolute",
    left: -(windowWidth * 0.031),
    paddingLeft: windowWidth * 0.031,
    paddingVertical: 10,
    paddingRight: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  reportText: {
    fontSize: 16,
    color: COLORS.text_gray,
    paddingLeft: 5,
  },
  reportWrap: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d4cfcf",
    borderRadius: 5,
    paddingHorizontal: 20,
  },
  screenSeparator: {
    width: "94%",
  },
  screenSeparatorWrap: {
    width: "100%",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  scrollProgress: {
    padding: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0, 0, 0, .3)",
    fontWeight: "bold",
    color: COLORS.white,
    position: "absolute",
    right: "3%",
    bottom: "3%",
  },
  sellerIcon: {
    height: 16,
    width: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    overflow: "hidden",
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerName: {
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  sellerWrap: {
    color: COLORS.text_gray,
    marginLeft: 5,
  },
  showMore: {
    color: COLORS.text_gray,
    paddingRight: 5,
  },
  showMoreWrap: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 10,
  },
  similarAddTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  similarAddTitleWrap: {
    paddingHorizontal: "3%",
    backgroundColor: COLORS.white,

    paddingBottom: 10,
  },
  similarAddWrap: {
    backgroundColor: COLORS.white,
  },
  soldOutBadge: {
    position: "absolute",
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,

    transform: [{ rotate: "45deg" }],
    zIndex: 5,
  },
  soldOutMessage: {
    color: COLORS.white,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  storeIcon: {
    // height: 118,
    // width: 18,
    alignItems: "center",
    justifyContent: "center",
    // borderRadius: 8,
    // overflow: "hidden",
  },
  storeIconImage: {
    height: 18,
    width: 18,
  },
  storeName: {
    fontWeight: "bold",
    color: COLORS.dodgerblue,
  },
});

export default ListingDetailScreen;
