import React, { Component } from "react";
import "./app.css";
import Meme from "../abis/MyNumber.json";
import $ from "jquery";
const Web3 = require("web3");
const networkUrl = "https://ropsten.infura.io/v3/18c0c6beb5764a6fbd1e8a71ec841e8a";
const serverUrl = "http://localhost:4200";

const IpfsHttpClient = require("ipfs-http-client");
const ipfs = IpfsHttpClient({ host: "ipfs.infura.io", port: "5001", protocol: "https" });
let context, video, uploadPanel, teachPanel, canvas;

class App extends Component {
	async componentWillMount() {
		await this.loadWeb3();
		await this.loadBlockchainData();

		canvas = document.querySelector("#canvas");
		context = canvas.getContext("2d");
		video = document.querySelector("#video");
		uploadPanel = document.querySelector("#upload-panel");
		teachPanel = document.querySelector("#teach");

		uploadPanel.style.display = "none";
		teachPanel.style.display = "none";

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
	}

	constructor(props) {
		super(props);
		this.state = { account: "", buffer: null, fileHash: "", contract: null };
	}

	loadWeb3 = async () => {
		if (window.ethereum) {
			window.web3 = new Web3(window.ethereum);
			await window.ethereum.enable;
		} else if (window.web3) {
			window.web3 = new Web3(window.web3.currentProvider);
		} else {
			window.web3 = new Web3(new Web3.providers.HttpProvider(networkUrl));
		}
	};

	// get the account
	loadBlockchainData = async () => {
		let accounts = await window.web3.eth.getAccounts();
		if (accounts.length) {
			this.setState({ account: accounts[0] });
		} else {
			window.alert("No account. Are you connecting to MetaMask?");
		}

		let networkId = await window.web3.eth.net.getId();
		const networkData = Meme.networks[networkId];
		if (networkData) {
			const abi = Meme.abi;
			const address = networkData.address;
			const contract = new window.web3.eth.Contract(abi, address);
			this.setState({ contract: contract });
			// call 'get' method in smart contract
			const fileHash = await contract.methods.get().call();
			this.setState({ fileHash: fileHash });
		} else {
			window.alert("Smart contract not deployed to the nerwork");
		}
	};

	onNameSubmit = async (event) => {
		event.preventDefault();

		$(".info.message").hide();
		context.drawImage(video, 0, 0, 400, 225);
		const dataURL = canvas.toDataURL();
		const name = $("#name").val();

		$.ajax({
			type: "POST",
			url: `${serverUrl}/facebox/teach`,
			data: {
				imgBase64: dataURL,
				name: name,
				id: this.state.account,
			},
			success: function(resp) {
				console.log(resp);
				$(".info.message")
					.text(`Welcome, ${name}`)
					.fadeIn();

				teachPanel.style.display = "none";
				uploadPanel.style.display = "block";
			},
			error: function() {
				$(".info.message")
					.text("Sorry, please try again")
					.fadeIn();
			},
		});
	};

	getWebFaceID() {
		$(".info.message").hide();
		context.drawImage(video, 0, 0, 400, 225);
		const dataURL = canvas.toDataURL();
		$.ajax({
			type: "POST",
			url: `${serverUrl}/webFaceID`,
			data: {
				imgBase64: dataURL,
			},
			success: function(resp) {
				if (resp.faces_len === 0) {
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
					teachPanel.style.display = "block";
					return;
				}

				$(".info.message")
					.text(`You are authorized ${resp.name}`)
					.fadeIn();

				uploadPanel.style.display = "block";
			},
			error: function() {
				$(".info.message")
					.text("Sorry, please try again")
					.fadeIn();
			},
		});
	}

	captureFile = (event) => {
		event.preventDefault();
		const file = event.target.files[0];
		// convert file to buffer
		const reader = new window.FileReader();
		reader.readAsArrayBuffer(file);
		reader.onloadend = () => {
			// setState is react method
			this.setState({ buffer: Buffer(reader.result) });
		};
	};

	onSubmit = async (event) => {
		event.preventDefault();
		for await (const result of ipfs.add(this.state.buffer)) {
			const fileHash = result.path;
			this.state.contract.methods
				.set(fileHash)
				.send({ from: this.state.account })
				.then((_) => {
					this.setState({ fileHash: fileHash });
				});
		}
	};

	render() {
		return (
			<div>
				<nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
					<a className="navbar-brand col-sm-3 col-md-2 mr-0" href="/" target="_blank" rel="noopener noreferrer">
						Facial Recognition
					</a>
					<ul className="navbar-nav px-3">
						<li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
							<small className="text-white">{this.state.account}</small>
						</li>
					</ul>
				</nav>
				<div className="container-fluid mt-5">
					<div className="row">
						<main role="main" className="col-lg-12 d-flex text-center">
							<div className="content mr-auto ml-auto">
								<div>
									<video id="video" width="400" height="225" muted autoPlay></video>
								</div>
								<canvas id="canvas" width="400" height="225" style={{ display: "none" }}></canvas>

								<button id="upload-btn" className="btn-sm btn-primary" style={{ margin: "20px auto" }} onClick={this.getWebFaceID}>
									Upload My Number
								</button>

								<div id="teach">
									<div>I don't know you... What's your name?</div>

									<form className="name-form" onSubmit={this.onNameSubmit}>
										<input type="text" id="name" />
										<input className="btn btn-sm btn-success" style={{ marginLeft: "10px" }} type="submit" />
									</form>
								</div>

								<div className="info message" style={{ display: "none" }}></div>

								<div id="upload-panel">
									<form onSubmit={this.onSubmit}>
										<input type="file" onChange={this.captureFile} />
										<input type="submit" />
									</form>

									<div style={{ marginTop: "30px" }}>
										<small>{`https://ipfs.infura.io/ipfs/${this.state.fileHash}`}</small>
									</div>

									<div>
										<img
											style={{ maxWidth: "300px", marginTop: "20px" }}
											src={`https://ipfs.infura.io/ipfs/${this.state.fileHash}`}
											alt="meme"
										/>
									</div>
								</div>
							</div>
						</main>
					</div>
				</div>
			</div>
		);
	}
}

export default App;
