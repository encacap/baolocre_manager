const validator = require("validator");
const axios = require("axios");
const SimpleMDE = require("simplemde");
const prepare = require("../utils/prepare");
const EncacapForm = require("../utils/form");
const EncacapFiles = require("../utils/files");
// const EncacapModal = require("../utils/modal");
const { createPreviewImage, handleURL } = require("../utils/helpers");
const { normalizeImageData } = require("../utils/cloudinary");

const createOption = (value, text, selected) => {
    const option = document.createElement("option");
    option.value = value;
    option.innerText = text;
    if (selected) {
        option.selected = true;
    }
    return option;
};

const renderOptions = (select, options, selected) => {
    const selectElement = select;
    const defaultOption = selectElement.querySelector("option[value='']");
    selectElement.innerHTML = "";
    if (!selected) {
        defaultOption.selected = true;
        selectElement.appendChild(defaultOption);
    }
    options.forEach((option) => {
        const { id, name } = option;
        const optionElement = createOption(id, name, id === selected);
        selectElement.appendChild(optionElement);
    });
};

prepare(async (request) => {
    const estateForm = new EncacapForm("#estate_form");

    const estateId = handleURL(window.location.href).query("id");
    let savedEstateCustomId = 0;
    const notification = handleURL(window.location.href).query("notification");

    const resortContainer = estateForm.querySelector("#resort");
    const groundContainer = estateForm.querySelector("#ground");

    const hiddenSubcategory = () => {
        resortContainer.classList.add("hidden");
        groundContainer.classList.add("hidden");
    };

    const showSubcategory = (category) => {
        if (category === "nghi-duong" || category === "nha-pho") {
            resortContainer.classList.remove("hidden");
        } else if (category === "dat-nen") {
            groundContainer.classList.remove("hidden");
        }
    };

    let estateData = {
        avatar: {},
        pictures: [],
    };

    if (notification) {
        if (notification === "published") {
            estateForm.showSuccess("B??i vi???t ???? ???????c xu???t b???n.");
        } else if (notification === "saved") {
            estateForm.showSuccess("C???p nh???t b??i vi???t th??nh c??ng.");
        }
    }

    estateForm.validate({
        city: [
            {
                role: "required",
                message: "T???nh, th??nh ph??? kh??ng ???????c ph??p ????? tr???ng",
            },
        ],
        district: [
            {
                role: "required",
                message: "Qu???n, huy???n kh??ng ???????c ph??p ????? tr???ng",
            },
        ],
        ward: [
            {
                role: "required",
                message: "X??, ph?????ng, th??? tr???n kh??ng ???????c ph??p ????? tr???ng",
            },
        ],
        title: [
            {
                role: "required",
                message: "Ti??u ????? kh??ng ???????c ph??p ????? tr???ng",
            },
        ],
        price: [
            {
                role: "required",
                message: "Gi?? b??n kh??ng ???????c ph??p ????? tr???ng",
            },
        ],
        area: [
            {
                role: "required",
                message: "Di???n t??ch kh??ng ???????c ph??p ????? tr???ng",
            },
        ],
        category: [
            {
                role: "required",
                message: "Danh m???c kh??ng ???????c ph??p ????? tr???ng",
            },
        ],
        contact_name: [
            {
                role: "required",
                message: "Th??ng tin li??n h??? kh??ng ???????c ph??p ????? tr???ng",
            },
        ],
        contact_phone: [
            {
                role: "required",
                message: "S??? ??i???n tho???i kh??ng ???????c ph??p ????? tr???ng",
            },
        ],
    });

    const simpleMDE = new SimpleMDE({
        element: estateForm.querySelector("#description"),
        spellChecker: false,
        hideIcons: ["image", "side-by-side", "fullscreen"],
    });

    /**
     * T???o hi???u ???ng cho c??i n??t ??? cu???i bi???u m???u & ????? d??? li???u lu??n, t???i l??? r???i =))
     */

    const formActions = estateForm.querySelector(".footer");
    const submitButton = estateForm.querySelector("button[type=submit]");
    const secondaryButton = estateForm.querySelector("button[type=button]");

    const estateIdInput = estateForm.querySelector("input[name=estate_id]");
    const streetInput = estateForm.querySelector("input[name=street]");
    const titleInput = estateForm.querySelector("input[name=title]");
    const priceInput = estateForm.querySelector("input[name=price]");
    const areaInput = estateForm.querySelector("input[name=area]");
    const categorySelect = estateForm.querySelector("select[name=category]");
    const livingRoomInput = estateForm.querySelector("input[name=living_room]");
    const bedroomInput = estateForm.querySelector("input[name=bedroom]");
    const bathroomInput = estateForm.querySelector("input[name=bathroom]");
    const pageInput = estateForm.querySelector("input[name=page]");
    const plotInput = estateForm.querySelector("input[name=plot]");
    const directionSelect = estateForm.querySelector("select[name=direction]");
    const contactNameInput = estateForm.querySelector("input[name=contact_name]");
    const contactPhoneInput = estateForm.querySelector("input[name=contact_phone]");

    const youtubeInput = estateForm.querySelector("input[name=youtube]");
    const youtubeAvatarCheckbox = estateForm.querySelector("input[name=youtube_avatar]");

    const avatarContainer = estateForm.querySelector("#avatar_container");
    const avatarImagesGroup = avatarContainer.querySelector(".form-images-group");
    const avatarImage = avatarContainer.querySelector(".form-images-preview img");
    const avatarInput = avatarContainer.querySelector("input");

    // X??? l?? v??? tr??

    const citySelect = estateForm.querySelector("select[name=city]");
    const districtSelect = estateForm.querySelector("select[name=district]");
    const wardSelect = estateForm.querySelector("select[name=ward]");

    const getWards = async (cityId, districtId, selectedWard) => {
        wardSelect.loading.show();
        wardSelect.disable();
        try {
            const { data: wards } = await request.get(`locations/${cityId}/${districtId}/wards`);
            renderOptions(wardSelect, wards, selectedWard);
            wardSelect.loading.hide();
            wardSelect.enable();
        } catch (error) {
            estateForm.showError("???? x???y ra l???i khi t???i d??? li???u x??, ph?????ng, th??? tr???n.", error?.response.data || error);
        }
    };

    const getDistricts = async (cityId, selectedDistrict) => {
        districtSelect.loading.show();
        districtSelect.disable();
        try {
            const { data: districts } = await request.get(`locations/${cityId}/districts`);
            renderOptions(districtSelect, districts, selectedDistrict);
            districtSelect.loading.hide();
            districtSelect.enable();
        } catch (error) {
            estateForm.showError("???? x???y ra l???i khi t???i d??? li???u qu???n, huy???n.", error?.response.data || error);
        }
    };

    const getCities = async (selectedCity = undefined) => {
        citySelect.loading.show();
        citySelect.disable();
        try {
            const { data: cities } = await request.get("locations/cities");
            renderOptions(citySelect, cities, selectedCity);
            citySelect.loading.hide();
            citySelect.enable();
        } catch (error) {
            estateForm.showError("???? x???y ra l???i khi t???i d??? li???u t???nh, th??nh ph???.", error?.response.data || error);
        }
    };

    districtSelect.disable();
    wardSelect.disable();

    const renderAvatarPreview = (file = null) => {
        avatarInput.error.hide();
        if (!file) {
            avatarImagesGroup.classList.remove("has-items");
            return;
        }
        avatarImage.src = createPreviewImage(file);
        avatarImagesGroup.classList.add("has-items");
    };

    const imagesContainer = estateForm.querySelector("#images_container");
    const imagesInput = imagesContainer.querySelector("input");
    const imagesPreviewContainer = imagesContainer.querySelector("#images_preview_container");

    const imageFiles = new EncacapFiles();

    const clearImagesPreview = () => {
        const elements = imagesPreviewContainer.children;
        Array.from(elements).forEach((element) => {
            if (element.tagName === "DIV") {
                element.remove();
            }
        });
    };

    const renderImagesPreview = () => {
        const images = imageFiles.getFiles();
        clearImagesPreview();
        if (images.length > 0) {
            imagesPreviewContainer.classList.add("has-items");
        } else {
            imagesPreviewContainer.classList.remove("has-items");
        }
        images.forEach((image) => {
            const imagePreview = document.createElement("div");
            imagePreview.classList.add("form-images-preview");
            imagePreview.dataset.id = image.id;
            imagePreview.innerHTML = `
                <img src="${createPreviewImage(image)}" />
                <div class="form-images-preview-remove">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <path
                            d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10ZM8 12h8M12 16V8"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        ></path>
                    </svg>
                </div>
            `;
            imagesPreviewContainer.appendChild(imagePreview);
        });
    };

    formActions.classList.remove("footer--hide");
    formActions.style.width = `${estateForm.getForm().offsetWidth}px`;

    if (estateId) {
        try {
            const { data } = await request.get(`estates/${estateId}`);
            estateData = data;
        } catch (error) {
            estateForm.disable();
            estateForm.showError("???? x???y ra l???i khi t??m ki???m th??ng tin b??i vi???t.", error.response?.data || error);
        }
    }

    if (estateId) {
        const {
            customId,
            location,
            title = "",
            price = "",
            area = "",
            category,
            properties,
            contact,
            description,
            youtube,
            avatar,
            pictures,
        } = estateData;

        const propertiesObject = properties.reduce((acc, property) => {
            const { name, value } = property;
            acc[name] = value;
            return acc;
        }, {});

        estateIdInput.value = customId;
        savedEstateCustomId = customId;

        const { city, district, ward } = location;

        if (city) {
            getCities(city.cityId);
            if (district) {
                getDistricts(city.cityId, district.districtId);
                if (ward) getWards(city.cityId, district.districtId, ward.wardId);
                else {
                    getWards(city.cityId, district.districtId);
                }
            } else {
                getDistricts(city.cityId);
            }
        } else {
            getCities();
        }

        if (location.street) streetInput.value = location.street;

        titleInput.value = title;
        priceInput.value = price;
        areaInput.value = area;

        if (category?.slug) {
            categorySelect.value = category.slug;
            showSubcategory(category.slug);
        }

        if (propertiesObject.living_room) livingRoomInput.value = propertiesObject.living_room;
        if (propertiesObject.bedroom) bedroomInput.value = propertiesObject.bedroom;
        if (propertiesObject.bathroom) bathroomInput.value = propertiesObject.bathroom;
        if (propertiesObject.page) pageInput.value = propertiesObject.page;
        if (propertiesObject.plot) plotInput.value = propertiesObject.plot;

        directionSelect.value = propertiesObject.direction || "";

        contactNameInput.value = contact.name;
        contactPhoneInput.value = contact.phone;

        if (youtube) {
            youtubeInput.value = youtube;
            youtubeAvatarCheckbox.enable();
        } else {
            youtubeAvatarCheckbox.disable();
        }

        if (avatar?.resourceType === "video") {
            youtubeAvatarCheckbox.checked = true;
            renderAvatarPreview(avatar);
        } else if (avatar?.resourceType === "image") {
            renderAvatarPreview(avatar);
        }

        if (pictures.length > 0) {
            pictures.forEach((picture) => imageFiles.push(picture));
            renderImagesPreview();
        }

        submitButton.querySelector("span").innerText = "C???p nh???t";

        if (estateData.isPublished) {
            submitButton.dataset.action = "save";
            secondaryButton.style.display = "none";
        } else {
            submitButton.dataset.action = "save";
            secondaryButton.querySelector("span").innerText = "Xu???t b???n";
            secondaryButton.dataset.action = "publish";
        }

        if (description) simpleMDE.value(description);
    }

    if (!estateId) {
        getCities();
    }

    citySelect.onchange = () => {
        const cityId = citySelect.value;
        if (!cityId) {
            return;
        }
        getDistricts(cityId);
    };

    districtSelect.onchange = () => {
        const cityId = citySelect.value;
        const districtId = districtSelect.value;
        if (!cityId || !districtId) {
            return;
        }
        getWards(cityId, districtId);
    };

    /**
     * X??? l?? khi ng?????i d??ng ch???n danh m???c cho B??S
     */

    categorySelect.onchange = () => {
        hiddenSubcategory();
        const category = categorySelect.value;
        if (category) {
            showSubcategory(category);
        }
    };

    /**
     * X??? l?? khi ng?????i d??ng ch???n h??nh ???nh cho B??S
     */

    imagesPreviewContainer.onclick = (event) => {
        const { target } = event;
        const removeButton = target.closest(".form-images-preview-remove");
        const imagePreview = target.closest(".form-images-preview");
        if (!removeButton) return;
        const imageId = imagePreview.dataset.id;
        imageFiles.remove(imageId);
        const { pictures: estatePictures } = estateData;
        estateData.pictures = estatePictures.filter((picture) => picture.publicId !== imageId);
        renderImagesPreview(imageId);
    };

    youtubeAvatarCheckbox.onchange = () => {
        const isChecked = youtubeAvatarCheckbox.checked;
        if (!isChecked) {
            const avatarFile = avatarInput.files[0];
            if (!avatarFile) {
                renderAvatarPreview();
            } else {
                renderAvatarPreview(avatarFile);
            }
            return;
        }
        renderAvatarPreview(youtubeInput.value);
    };

    youtubeInput.oninput = () => {
        const youtubeURL = youtubeInput.value;
        if (!validator.isURL(youtubeURL)) {
            renderAvatarPreview();
            youtubeAvatarCheckbox.checked = false;
            youtubeAvatarCheckbox.disable();
            return;
        }
        youtubeAvatarCheckbox.enable();
    };

    avatarInput.onchange = () => {
        const avatarFile = avatarInput.files[0];
        if (!avatarFile) return;
        youtubeAvatarCheckbox.checked = false;
        renderAvatarPreview(avatarFile);
    };

    imagesInput.oninput = () => {
        const images = imagesInput.files;
        let isRerenderPreview = false;
        for (let i = 0; i < images.length; i += 1) {
            const file = images[i];
            isRerenderPreview = imageFiles.push(file);
        }
        if (isRerenderPreview) {
            renderImagesPreview();
        }
    };

    /**
     * X??? l?? khi nh???n n??t ????ng tin
     */

    // const progressModel = new EncacapModal("#progressModel");
    // const signatureProgressElement = document.querySelector("#signature_progress");
    // const avatarProgressElement = document.querySelector("#avatar_progress");
    // const imagesProgressElement = document.querySelector("#images_progress");
    // const saveProgressElement = document.querySelector("#save_progress");
    // const loadingElement = `<div class="spinner w-4 h-4 border-2 border-encacap-main rounded-full"></div>`;
    // const successElement = `<div class="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500"></div>`;
    // const errorElement = `<div class="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500"></div>`;

    const cloudinaryInstance = axios.create({
        baseURL: "https://api.cloudinary.com/v1_1",
    });

    const uploadImage = (file, options) => {
        const { key: apiKey, eager, folder, timestamp, signature, name } = options;
        const formData = new FormData();

        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("eager", eager);
        formData.append("folder", folder);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
        return cloudinaryInstance.post(`${name}/image/upload`, formData);
    };

    const enableForm = () => {
        estateForm.enable();
        submitButton.loading.hide();
        submitButton.enable();
    };

    const handleSubmit = async (validation = true) => {
        const unexpectedKeys = ["avatar", "images", "youtube_avatar"];

        if (validation) {
            if (!estateForm.executeValidation()) {
                submitButton.loading.hide();
                secondaryButton.loading.hide();
                return;
            }
        }

        estateForm.disable();

        const inputData = estateForm.getData();

        estateData = Object.assign(
            estateData,
            Object.keys(inputData).reduce((acc, key) => {
                if (unexpectedKeys.includes(key)) {
                    return acc;
                }
                return {
                    ...acc,
                    [key]: inputData[key].value,
                };
            }, {}),
            { description: simpleMDE.value() }
        );

        estateData.isPublished = validation;

        // Ki???m tra xem c?? ???nh ?????i di???n kh??ng
        if (validation && !youtubeAvatarCheckbox.checked && avatarInput.files.length === 0 && !estateId) {
            avatarInput.error.show("???nh ?????i di???n kh??ng ???????c ph??p ????? tr???ng");
            submitButton.loading.hide();
            secondaryButton.loading.hide();
            enableForm();
            return;
        }

        // Thi???u tr?????ng h???p ?????i t??? Youtube sang ???nh

        // Ki???m tra xem M?? b???t ?????ng s???n c?? b??? tr??ng kh??ng
        if (estateData.estate_id && estateData.estate_id !== savedEstateCustomId) {
            const customEstateId = estateData.estate_id;
            try {
                const { data: estate } = await request.get(`estates/${customEstateId}`);
                if (estate) {
                    const customIdInput = estateForm.querySelector("#estate_id");
                    customIdInput.error.show("M?? b???t ?????ng s???n ???? t???n t???i");
                    submitButton.loading.hide();
                    secondaryButton.loading.hide();
                    enableForm();
                    return;
                }
            } catch (error) {
                const errorStatus = error?.response.status;
                if (errorStatus !== 404) {
                    estateForm.showError(
                        "???? x???y ra l???i khi ki???m tra t??nh kh??? d???ng c???a 'M?? B??S'",
                        error?.response.data || error
                    );
                    submitButton.loading.hide();
                    secondaryButton.loading.hide();
                    enableForm();
                    return;
                }
            }
        }

        let signature;

        try {
            const { data: response } = await request.get("images/signature");
            signature = response;
        } catch (error) {
            estateForm.showError("???? x???y ra l???i khi k???t n???i v???i m??y ch???.", error?.response.data || error);
            submitButton.loading.hide();
            secondaryButton.loading.hide();
            enableForm();
            return;
        }

        if (avatarInput?.files.length > 0 && !youtubeAvatarCheckbox.checked) {
            try {
                const { data: avatarResponse } = await uploadImage(avatarInput.files[0], signature);
                estateData.avatar = normalizeImageData({ ...avatarResponse, ...signature });
            } catch (error) {
                estateForm.showError("???? x???y ra l???i khi t???i l??n ???nh ?????i di???n.", error?.response.data || error);
                submitButton.loading.hide();
                secondaryButton.loading.hide();
                enableForm();
                return;
            }
        } else if (youtubeAvatarCheckbox.checked) {
            const youtubeURL = youtubeInput.value;
            estateData.avatar = normalizeImageData(youtubeURL);
        }

        if (imageFiles.getTrueFile().length > 0) {
            try {
                const imageResponses = await Promise.all(
                    imageFiles.getTrueFile().map((file) => uploadImage(file, signature))
                );
                const { pictures: estatePictures } = estateData;
                estateData.pictures = [
                    ...estatePictures,
                    ...imageResponses.map((imageResponse) =>
                        normalizeImageData({ ...imageResponse.data, ...signature })
                    ),
                ];
            } catch (error) {
                estateForm.showError("???? x???y ra l???i khi t???i l??n ???nh.", error?.response.data || error);
                submitButton.loading.hide();
                secondaryButton.loading.hide();
                enableForm();
                return;
            }
        }

        try {
            if (!estateId) {
                const { data: responses } = await request.post("estates", estateData);
                window.location.href = `./modify.html?id=${responses.id}&notification=${
                    validation ? "published" : "saved"
                }`;
                return;
            }
            await request.patch(`estates/${estateId}`, estateData);
            window.location.href = `./modify.html?id=${estateId}&notification=${validation ? "published" : "saved"}`;
        } catch (error) {
            estateForm.showError("???? x???y ra l???i khi l??u th??ng tin b??i vi???t.", error?.response.data || error);
            submitButton.loading.hide();
            secondaryButton.loading.hide();
            enableForm();
            // Ph???i xo?? ???nh ?????i di???n v?? ???nh b??? sung ????? kh??ng b??? l??u l???i
        }
    };

    submitButton.onclick = (event) => {
        event.preventDefault();
        submitButton.loading.show();
        const buttonElement = event.target.closest("button");
        const { action } = buttonElement.dataset;
        if (action === "publish") {
            handleSubmit(true);
        } else if (action === "save") {
            handleSubmit(false);
        }
    };

    secondaryButton.onclick = (event) => {
        event.preventDefault();
        secondaryButton.loading.show();
        const buttonElement = event.target.closest("button");
        const { action } = buttonElement.dataset;
        if (action === "publish") {
            handleSubmit(true);
        } else if (action === "save") {
            handleSubmit(false);
        }
    };
});
