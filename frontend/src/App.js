// src/App.js
import Header from "./components/header/Header";

export default function App() {
  const handleSearch = (text) => {
    console.log("Search:", text);
    // TODO: navigate or call your API
  };

  return (
    <>
      <Header
        logoSrc="/ticket-nepal-logo.png"
        avatarSrc="/me.jpg"
        onSearch={handleSearch}
        onMenuClick={() => console.log("Open sidebar")}
        onProfileClick={() => console.log("Open profile menu")}
      />
      {/* rest of your pages */}
    </>
  );
}
