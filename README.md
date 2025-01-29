Coletando informações do workspace

# Blockchain P2P Network

This project implements a simple blockchain with a peer-to-peer (P2P) network using Node.js. The blockchain is capable of adding new blocks and synchronizing the chain across multiple peers in the network. The project uses WebSockets for P2P communication and Express for the HTTP API.

## Table of Contents

- Features
- Prerequisites
- Installation
- Configuration
- Usage
- API Endpoints
- Project Structure
- Security Considerations
- License

## Features

- **Blockchain**: Basic implementation of a blockchain with block validation.
- **P2P Network**: Peer-to-peer network using WebSockets for communication.
- **HTTP API**: RESTful API for interacting with the blockchain.
- **UPnP**: Automatic port forwarding using UPnP.
- **Environment Configuration**: Easy configuration using environment variables.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/SergioBonatto/cht.git
   cd cht
   ```

2. Install the dependencies:

   ```sh
   npm install
   ```

## Configuration

1. Create a `.env` file in the root directory based on the provided `.env.example`:

   ```sh
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:

   ```env
   P2P_PORT=6001
   HTTP_PORT=3001
   INITIAL_PEER=ws://<PEER_IP>:6001
   ```

3. Ensure you have the necessary SSL certificates and keys. You can use the provided examples as a reference:

   - key.pem
   - key_unencrypted.pem
   - cert.pem

## Usage

Start the server:

```sh
npm start
```

The HTTP server will run on the port specified in the `.env` file (default: 3001), and the WebSocket server will run on the port specified in the `.env` file (default: 6001).

## API Endpoints

### Get Blockchain

- **URL**: `/blocks`
- **Method**: `GET`
- **Description**: Retrieves the current blockchain.

### Mine Block

- **URL**: `/mine`
- **Method**: `POST`
- **Description**: Mines a new block with the provided data and broadcasts it to the network.
- **Request Body**:

  ```json
  {
    "data": "Block data"
  }
  ```

## Project Structure

```
.env
.env.example
cert.pem
cert.pem.example
key_unencrypted.pem
key.pem
key.pem.example
package.json
src/
  ├── block.js
  ├── blockchain.js
  ├── index.js
  ├── p2pNetwork.js
  └── server.js
```

- **`src/block.js`**: Defines the `Block` class.
- **`src/blockchain.js`**: Defines the `Blockchain` class.
- **`src/p2pNetwork.js`**: Defines the `P2PNetwork` class.
- **`src/server.js`**: Configures and starts the HTTP and WebSocket servers.
- **`src/index.js`**: Entry point of the application.

## Security Considerations

- **Private Keys**: Never commit private keys (key.pem, key_unencrypted.pem) to a public repository. Use environment variables or secure storage solutions.
- **SSL/TLS**: Ensure that SSL/TLS certificates are properly configured to secure communication between peers.
- **Environment Variables**: Use environment variables to manage sensitive configuration data.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

Feel free to contribute to this project by submitting issues or pull requests. For major changes, please open an issue first to discuss what you would like to change.

Happy coding! 🚀
