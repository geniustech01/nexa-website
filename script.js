const menuButton = document.querySelector("#menu-button");
const closeMenuButton = document.querySelector("#close-menu");
const navigationPanel = document.querySelector("#navigation-panel");
const navigationBackdrop = document.querySelector("#navigation-backdrop");
const accountDialog = document.querySelector("#account-dialog");
const accountForm = document.querySelector("#account-form");
const accountActions = document.querySelector("#account-actions");
const profileArea = document.querySelector("#profile-area");
const profileButton = document.querySelector("#profile-button");
const profilePopover = document.querySelector("#profile-popover");
const profileName = document.querySelector("#profile-name");
const profileInitials = document.querySelector("#profile-initials");
const profileImage = document.querySelector("#profile-image");
const popoverProfileInitials = document.querySelector("#popover-profile-initials");
const popoverProfileImage = document.querySelector("#popover-profile-image");
const profileStatus = document.querySelector("#profile-status");
const logoutButton = document.querySelector("#logout-button");
const searchInput = document.querySelector("#site-search");
const nameField = document.querySelector("#name-field");
const photoField = document.querySelector("#photo-field");
const nameInput = document.querySelector("#name-input");
const emailInput = document.querySelector("#email-input");
const passwordInput = document.querySelector("#password-input");
const photoInput = document.querySelector("#photo-input");
const profilePhotoInput = document.querySelector("#profile-photo-input");
const photoStatus = document.querySelector("#photo-status");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector("#dialog-description");
const submitAccountButton = document.querySelector("#submit-account");

const PROFILE_STORAGE_KEY = "nexa-profile";
let isSignUp = false;
let selectedPhoto = "";
let currentProfile = { name: "Your profile", photo: "", signedIn: false };

function setNavigationOpen(isOpen) {
  navigationPanel.classList.toggle("is-open", isOpen);
  navigationPanel.setAttribute("aria-hidden", String(!isOpen));
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  navigationBackdrop.hidden = !isOpen;
}

menuButton.addEventListener("click", () => {
  setNavigationOpen(menuButton.getAttribute("aria-expanded") !== "true");
});
closeMenuButton.addEventListener("click", () => setNavigationOpen(false));
navigationBackdrop.addEventListener("click", () => setNavigationOpen(false));
navigationPanel.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setNavigationOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setNavigationOpen(false);
    profilePopover.hidden = true;
    profileButton.setAttribute("aria-expanded", "false");
  }
  if (
    event.key === "/" &&
    !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) &&
    !accountDialog.open
  ) {
    event.preventDefault();
    searchInput.focus();
  }
});

function initialsFor(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "N";
}

function setProfilePicture(image, initials, photo) {
  if (photo) {
    image.src = photo;
    image.hidden = false;
    initials.hidden = true;
  } else {
    image.removeAttribute("src");
    image.hidden = true;
    initials.hidden = false;
  }
}

function renderProfile(profile) {
  currentProfile = {
    name: profile.name || "Your profile",
    photo: profile.photo || "",
    signedIn: Boolean(profile.signedIn),
  };
  accountActions.hidden = currentProfile.signedIn;
  profileArea.hidden = false;
  profileButton.setAttribute("aria-label", `Open ${currentProfile.name}'s profile`);
  profileName.textContent = currentProfile.name;
  profileInitials.textContent = initialsFor(currentProfile.name);
  popoverProfileInitials.textContent = initialsFor(currentProfile.name);
  logoutButton.hidden = !currentProfile.signedIn;
  setProfilePicture(profileImage, profileInitials, currentProfile.photo);
  setProfilePicture(popoverProfileImage, popoverProfileInitials, currentProfile.photo);
}

function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Could not save the NEXA profile in this browser.", error);
    throw new Error("Could not save your profile picture. Try a smaller image.");
  }
}

function readProfilePhoto(file) {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Choose an image file for your profile picture."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", () => reject(new Error("Could not read that image.")));
    reader.addEventListener("load", () => {
      const source = new Image();
      source.addEventListener("error", () => reject(new Error("Could not open that image.")));
      source.addEventListener("load", () => {
        const maxDimension = 320;
        const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Your browser could not process that image."));
          return;
        }
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      });
      source.src = typeof reader.result === "string" ? reader.result : "";
    });
    reader.readAsDataURL(file);
  });
}

function openAccountDialog(signUp) {
  isSignUp = signUp;
  nameField.hidden = !signUp;
  photoField.hidden = !signUp;
  nameInput.required = signUp;
  passwordInput.autocomplete = signUp ? "new-password" : "current-password";
  dialogTitle.textContent = signUp ? "Create your account" : "Welcome back";
  dialogDescription.textContent = signUp
    ? "Enter your details to sign up."
    : "Log in to your account.";
  submitAccountButton.textContent = signUp ? "Sign up" : "Log in";
  accountForm.reset();
  selectedPhoto = currentProfile.photo;
  photoStatus.textContent = "";
  accountDialog.showModal();
}

document.querySelector("#login-button").addEventListener("click", () => {
  openAccountDialog(false);
});
document.querySelector("#signup-button").addEventListener("click", () => {
  openAccountDialog(true);
});
document.querySelector("#dialog-close").addEventListener("click", () => {
  accountDialog.close();
});

photoInput.addEventListener("change", async () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  try {
    selectedPhoto = await readProfilePhoto(file);
    photoStatus.textContent = "Profile picture ready.";
  } catch (error) {
    photoStatus.textContent = error.message;
  }
});

profilePhotoInput.addEventListener("change", async () => {
  const file = profilePhotoInput.files?.[0];
  if (!file) return;
  profileStatus.textContent = "";
  try {
    const photo = await readProfilePhoto(file);
    const updatedProfile = { ...currentProfile, photo };
    saveProfile(updatedProfile);
    renderProfile(updatedProfile);
    profileStatus.textContent = "Profile picture updated.";
  } catch (error) {
    profileStatus.textContent = error.message;
  } finally {
    profilePhotoInput.value = "";
  }
});

document.querySelector("#change-photo-button").addEventListener("click", () => {
  profilePhotoInput.click();
});

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!accountForm.reportValidity()) return;

  const emailName = emailInput.value.split("@")[0].replace(/[._-]+/g, " ");
  const profile = {
    name: (isSignUp ? nameInput.value : emailName).trim() || "NEXA member",
    photo: selectedPhoto,
    signedIn: true,
  };

  try {
    saveProfile(profile);
    renderProfile(profile);
    accountDialog.close();
  } catch (error) {
    photoStatus.textContent = error.message;
  }
});

const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
if (savedProfile) {
  try {
    renderProfile(JSON.parse(savedProfile));
  } catch (error) {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    console.error("Could not load the saved NEXA profile.", error);
  }
}

profileButton.addEventListener("click", () => {
  const isOpen = profileButton.getAttribute("aria-expanded") === "true";
  profileButton.setAttribute("aria-expanded", String(!isOpen));
  profilePopover.hidden = isOpen;
  if (!isOpen) profileStatus.textContent = "";
});

logoutButton.addEventListener("click", () => {
  const guestProfile = {
    name: "Your profile",
    photo: currentProfile.photo,
    signedIn: false,
  };
  try {
    saveProfile(guestProfile);
    renderProfile(guestProfile);
    profilePopover.hidden = true;
    profileButton.setAttribute("aria-expanded", "false");
  } catch (error) {
    profileStatus.textContent = error.message;
  }
});

document.addEventListener("click", (event) => {
  if (!profileArea.contains(event.target)) {
    profilePopover.hidden = true;
    profileButton.setAttribute("aria-expanded", "false");
  }
});
