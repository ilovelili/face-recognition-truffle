$(function() {
	const canvas = document.getElementById("canvas");
	const context = canvas.getContext("2d");
	const video = document.getElementById("video");
	const button1 = $("#snap");
	const sendTxButton = $("#send-tx");
	const imageContainer = $("#my-number");
	const txDetails = `<input id="uploader" type='file'></input>`;
	// const networkUrl = "http://127.0.0.1:8545";
	const networkUrl = "https://ropsten.infura.io/v3/18c0c6beb5764a6fbd1e8a71ec841e8a";
	let abiJsonUrl = `https://raw.githubusercontent.com/ilovelili/face-recognition-truffle/master/src/abis/MyNumber.json?d=${new Date().getTime()}`;
	const ipfs = IpfsHttpClient({ host: "ipfs.infura.io", port: "5001", protocol: "https" });

	let dataURL;
	let account;
	let fileHashUrl;
	let web3;
	let data;
	let contract;
	let name;

	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices
			.getUserMedia({
				video: true,
			})
			.then(function(stream) {
				video.srcObject = stream;
				video.play();
			});
	}

	async function loadWeb3() {
		// already loaded
		if (contract) return true;

		if (window.ethereum) {
			// new Web3(new Web3.providers.HttpProvider(ganacheUrl));
			web3 = new Web3(window.ethereum);
			await window.ethereum.enable;
		} else if (window.web3) {
			web3 = new Web3(window.web3.currentProvider);
		} else {
			web3 = new Web3(new Web3.providers.HttpProvider(networkUrl));
		}

		let accounts = await web3.eth.getAccounts();
		if (accounts.length) {
			account = accounts[0];
		} else {
			window.alert("no account");
			return false;
		}

		let networkId = await web3.eth.net.getId();
		if (!networkId) {
			window.alert("no network id");
			return false;
		}

		console.log(`network id is ${networkId}`);
		const MyNumber = await $.getJSON(abiJsonUrl);
		const networkData = MyNumber.networks[networkId];
		console.log(networkData);

		if (networkData) {
			const abi = MyNumber.abi;
			const address = networkData.address;
			contract = new web3.eth.Contract(abi, address);
		} else {
			window.alert("Smart contract not deployed to the nerwork");
			return false;
		}

		return true;
	}

	async function loadImage() {
		let web3loaded = await loadWeb3();
		if (!web3loaded) return;

		contract.methods
			.get()
			.call()
			.then((fileHash) => {
				fileHashUrl = `https://ipfs.infura.io/ipfs/${fileHash}`;
				console.log(fileHashUrl);
				imageContainer.attr("src", fileHashUrl);
			});
	}

	function captureFile() {
		event.preventDefault();
		const file = event.target.files[0];
		// convert file to buffer
		const reader = new window.FileReader();
		reader.readAsArrayBuffer(file);
		reader.onloadend = () => {
			data = reader.result;
		};
	}

	async function uploadMyNumber() {
		event.preventDefault();

		let web3loaded = await loadWeb3();
		if (!web3loaded) return;

		for await (const result of ipfs.add(data)) {
			const fileHash = result.path;
			contract.methods
				.set(fileHash)
				.send({ from: account })
				.then((_) => {
					fileHashUrl = `https://ipfs.infura.io/ipfs/${fileHash}`;
					console.log(fileHashUrl);
					imageContainer.attr("src", fileHashUrl);

					$(".ui.modal").modal("hide");
					$(".info.message")
						.text(`Upload completed. ${fileHashUrl}`)
						.fadeIn();
				});
		}
	}

	// Send transaction function
	function showUploadModal() {
		console.log("send tx");
		const form = document.querySelector(".name-form");
		document.querySelector("#modal-header").innerText = `Upload your my number card, ${name}`;
		let uploader = document.querySelector("#uploader");

		if (!uploader) {
			form.insertAdjacentHTML("afterbegin", txDetails);
			uploader = document.querySelector("#uploader");
		}

		nameIuputs = document.querySelectorAll(".input-name");
		for (let i = 0; i < nameIuputs.length; i++) {
			$(nameIuputs[i]).css("display", "none");
		}

		$(".ui.modal").modal("show");
		uploader.addEventListener("change", captureFile);
		form.addEventListener("submit", uploadMyNumber);
	}

	async function fetchName() {
		event.preventDefault();
		var name = event.target[0].value;
		await sendTeachData(name);
		$(".ui.modal").modal("hide");
		document.querySelector(".name-form").removeEventListener("submit", fetchName, { passive: true });
	}

	function openModal() {
		$(".ui.modal").modal("show");
		document.querySelector(".name-form").addEventListener("submit", fetchName);
	}

	function startTeaching() {
		button1.addClass("loading");
		$(".info.message").hide();
		context.drawImage(video, 0, 0, 400, 225);
		dataURL = canvas.toDataURL();
		openModal();
	}

	// Send data to api
	async function sendTeachData(name) {
		$.ajax({
			type: "POST",
			url: "/facebox/teach",
			data: {
				imgBase64: dataURL,
				name: name,
				id: account,
			},
			success: function(resp) {
				console.log(resp);
				sendTxButton[0].style.display = "";
				$(".info.message")
					.text(`Welcome, ${name}. Your address is ${account}`)
					.fadeIn();
			},
			error: function() {
				$(".info.message")
					.text("Sorry, please try again")
					.fadeIn();
			},
			complete: function() {
				sendTxButton.removeClass("loading");
			},
		});
	}

	// Trigger photo take
	sendTxButton.click(function() {
		sendTxButton.addClass("loading");
		$(".info.message").hide();
		context.drawImage(video, 0, 0, 400, 225);
		dataURL = canvas.toDataURL();
		$.ajax({
			type: "POST",
			url: "/webFaceID",
			data: {
				imgBase64: dataURL,
			},
			success: function(resp) {
				if (resp.faces_len == 0) {
					$(".info.message")
						.text("We didn't see a face")
						.fadeIn();
					return;
				}
				if (resp.faces_len > 1) {
					$(".info.message")
						.text("You must be alone to use Web Face ID securely")
						.fadeIn();
					return;
				}
				if (!resp.matched) {
					console.log("unsuccessfull");
					sendTxButton.transition("shake");
					sendTxButton[0].style.display = "none";
					// call teach function
					startTeaching();
					return;
				}
				console.log(resp);
				name = resp.name;
				$(".info.message")
					.text(`You are authorized ${name}`)
					.fadeIn();
				console.log("success");
				console.info(resp);

				showUploadModal();
			},
			error: function() {
				$(".info.message")
					.text("Sorry, please try again")
					.fadeIn();
			},
			complete: function() {
				sendTxButton.removeClass("loading");
			},
		});
	});

	loadImage();
});
