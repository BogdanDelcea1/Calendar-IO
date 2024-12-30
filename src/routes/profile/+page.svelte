<!-- src/routes/profile/+page.svelte -->

<script>
  import { browser } from '$app/environment';
  import DeleteAccount from './DeleteAccount.svelte';

  export let data;

  let user = data.user;
  let firstName = user.firstName || '';
  let lastName = user.lastName || '';
  let profileImage = null;
  let profileImageFile = null;
  let error = data.error || '';
  let success = data.success || false;

  // Convert the binary data to a Base64 string for display using Blob and FileReader
  if (user.profileImage) {
    if (browser) {
      let imageData;

      if (user.profileImage instanceof Uint8Array) {
        imageData = user.profileImage;
      } else if (user.profileImage.data) {
        imageData = Uint8Array.from(user.profileImage.data);
      }

      if (imageData) {
        const blob = new Blob([imageData], { type: 'image/png' });
        const reader = new FileReader();
        reader.onload = function (e) {
          profileImage = e.target.result;
        };
        reader.readAsDataURL(blob);
      }
    }
  }

  function handleFileChange(event) {
    profileImageFile = event.target.files[0];

    // Limit the file size to prevent large uploads
    const maxSize = 16 * 1024 * 1024; // 16 MB
    if (profileImageFile.size > maxSize) {
      alert('Image size exceeds the maximum allowed size of 16 MB.');
      profileImageFile = null;
      event.target.value = ''; // Clear the file input
      return;
    }

    // Display the selected image immediately
    if (browser) {
      const reader = new FileReader();
      reader.onload = function (e) {
        profileImage = e.target.result;
      };
      reader.readAsDataURL(profileImageFile);
    }
  }
</script>

<main>
  <h1>Profile</h1>

  {#if error}
    <p style="color: red;">{error}</p>
  {/if}

  {#if success}
    <p style="color: green;">Profile updated successfully.</p>
  {/if}

  <form method="post" enctype="multipart/form-data">
    <div>
      <label for="firstName">First Name:</label><br />
      <input type="text" id="firstName" name="firstName" bind:value={firstName} />
    </div>

    <div>
      <label for="lastName">Last Name:</label><br />
      <input type="text" id="lastName" name="lastName" bind:value={lastName} />
    </div>

    <div>
      <label for="profileImage">Profile Picture:</label><br />
      <input
        type="file"
        id="profileImage"
        name="profileImage"
        accept="image/*"
        on:change={handleFileChange}
      />
    </div>

    {#if profileImage}
      <div>
        <img src={profileImage} alt="Profile Picture" class="profile-picture-preview" />
      </div>
    {/if}

    <button type="submit">Update Profile</button>
  </form>

  <!-- Delete Account Section -->
  <section class="delete-account-section">
    <DeleteAccount />
  </section>
</main>

<style>
  main {
    max-width: 600px;
    margin: 0 auto;
  }

  label {
    font-weight: bold;
  }

  input[type='text'],
  input[type='password'],
  input[type='email'] {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 1rem;
  }

  .profile-picture-preview {
    width: 150px;
    height: 150px;
    object-fit: cover;
    border-radius: 50%;
    margin-top: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  .delete-account-section {
    margin-top: 2rem;
    padding: 1rem;
    border-top: 1px solid #ccc;
  }

  /* Styles for the Delete Account component */
  .delete-account-section h2 {
    color: #ff0000;
  }

  .delete-account-section label {
    display: block;
    margin-bottom: 1rem;
  }

  .delete-account-section input[type='password'] {
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.5rem;
  }

  .delete-account-section button {
    background-color: #ff0000;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    cursor: pointer;
  }

  .delete-account-section button:hover {
    background-color: #cc0000;
  }
</style>
