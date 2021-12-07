const validator = require("validator");
const prepare = require("../utils/prepare");
const EncacapForm = require("../utils/form");
const EncacapFiles = require("../utils/files");
const { generateYoutubePreview } = require("../utils/helpers");

const createPreviewImage = (file) => {
    if (!file) return;
    if (typeof file === "object") {
        if (file.lastModified) {
            return URL.createObjectURL(file);
        }
    } else if (typeof file === "string") {
        if (file.includes("youtube")) {
            return generateYoutubePreview(file);
        }
    }
};

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

    estateForm.validate({
        city: [
            {
                role: "required",
                message: "Tỉnh, thành phố không được phép để trống",
            },
        ],
        district: [
            {
                role: "required",
                message: "Quận, huyện không được phép để trống",
            },
        ],
        ward: [
            {
                role: "required",
                message: "Xã, phường, thị trấn không được phép để trống",
            },
        ],
        title: [
            {
                role: "required",
                message: "Tiêu đề không được phép để trống",
            },
        ],
        price: [
            {
                role: "required",
                message: "Giá bán không được phép để trống",
            },
        ],
        area: [
            {
                role: "required",
                message: "Diện tích không được phép để trống",
            },
        ],
        category: [
            {
                role: "required",
                message: "Danh mục không được phép để trống",
            },
        ],
        contact_name: [
            {
                role: "required",
                message: "Thông tin liên hệ không được phép để trống",
            },
        ],
        contact_phone: [
            {
                role: "required",
                message: "Số điện thoại không được phép để trống",
            },
        ],
    });

    /**
     * Tạo hiệu ứng cho cái nút ở cuối form
     */

    const formActions = estateForm.querySelector(".footer");

    formActions.classList.add("flex");
    formActions.classList.remove("hidden");
    formActions.style.width = `${estateForm.getForm().offsetWidth}px`;

    /**
     * Xử lý khi người dùng chọn vị trí cho bất động sản
     */

    const citySelect = estateForm.querySelector("select[name=city]");
    const districtSelect = estateForm.querySelector("select[name=district]");
    const wardSelect = estateForm.querySelector("select[name=ward]");

    const getWards = async (cityId, districtId) => {
        wardSelect.loading.show();
        wardSelect.disable();
        try {
            const { data: wards } = await request.get(`locations/${cityId}/${districtId}/wards`);
            renderOptions(wardSelect, wards);
            wardSelect.loading.hide();
            wardSelect.enable();
        } catch (error) {
            estateForm.showError("Đã xảy ra lỗi khi tải dữ liệu xã, phường, thị trấn.", error.response.data || error);
        }
    };

    const getDistricts = async (cityId) => {
        districtSelect.loading.show();
        districtSelect.disable();
        try {
            const { data: districts } = await request.get(`locations/${cityId}/districts`);
            renderOptions(districtSelect, districts);
            districtSelect.loading.hide();
            districtSelect.enable();
        } catch (error) {
            estateForm.showError("Đã xảy ra lỗi khi tải dữ liệu quận, huyện.", error.response.data || error);
        }
    };

    const getCities = async () => {
        citySelect.loading.show();
        citySelect.disable();
        try {
            const { data: cities } = await request.get("locations/cities");
            renderOptions(citySelect, cities);
            citySelect.loading.hide();
            citySelect.enable();
        } catch (error) {
            estateForm.showError("Đã xảy ra lỗi khi tải dữ liệu tỉnh, thành phố.", error.response.data || error);
        }
    };

    districtSelect.disable();
    wardSelect.disable();

    getCities();

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
     * Xử lý khi người dùng chọn danh mục cho BĐS
     */

    const categorySelect = estateForm.querySelector("select[name=category]");
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

    categorySelect.onchange = () => {
        hiddenSubcategory();
        const category = categorySelect.value;
        if (category) {
            showSubcategory(category);
        }
    };

    /**
     * Xử lý khi người dùng chọn hình ảnh cho BĐS
     */

    const youtubeInput = estateForm.querySelector("input[name=youtube]");
    const youtubeAvatarCheckbox = estateForm.querySelector("input[name=youtube_avatar]");

    const avatarContainer = estateForm.querySelector("#avatar_container");
    const avatarImagesGroup = avatarContainer.querySelector(".form-images-group");
    const avatarImage = avatarContainer.querySelector(".form-images-preview img");
    const avatarInput = avatarContainer.querySelector("input");

    const renderAvatarPreview = (file = null) => {
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

    imagesPreviewContainer.onclick = (event) => {
        const { target } = event;
        const removeButton = target.closest(".form-images-preview-remove");
        const imagePreview = target.closest(".form-images-preview");
        if (!removeButton) return;
        const imageId = imagePreview.dataset.id;
        imageFiles.remove(imageId);
        renderImagesPreview(imageId);
    };

    // Disable youtube avatar checkbox if youtube input is empty
    youtubeAvatarCheckbox.disable();

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
     * Xử lý khi nhấn nút đăng tin
     */

    estateForm.onsubmit = async (event, data) => {
        console.log(data);
    };
});
