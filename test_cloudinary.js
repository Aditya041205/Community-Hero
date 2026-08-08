const test = async () => {
  const formData = new FormData();
  formData.append("file", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88B9RAgAEfQIA3v8L7AAAAABJRU5ErkJggg==");
  formData.append("upload_preset", "civic_action");

  const response = await fetch(`https://api.cloudinary.com/v1_1/a1g8nbso/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  console.log(response.ok, data);
}
test();
