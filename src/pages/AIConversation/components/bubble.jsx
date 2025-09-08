function Bubble(props) {
  const { msg } = props;

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: msg.role === "assistant" ? "row" : "row-reverse",
        }}
      >
        <p
          style={{
            color: msg.role === "assistant" ? "#5D5D5D" : "#82AF75",
            backgroundColor: "white",
            borderRadius: 8,
            marginTop: 8,
            marginBottom: 8,
          }}
        >
          {msg.textDelta ?? msg.textFinal ?? ""}
        </p>
      </div>
    </div>
  );
}

export default Bubble;
export { Bubble };
