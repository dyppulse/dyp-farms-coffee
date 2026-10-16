import { isValidPhone, normalizePhone, pollTopUp } from "../walletPolling";

const tx = (status: string) => ({ transaction: { status } as any });
const opts = { attempts: 3, sleep: async () => {} };

describe("pollTopUp", () => {
  it("resolves completed once the provider confirms", async () => {
    const poll = jest
      .fn()
      .mockResolvedValueOnce(tx("pending"))
      .mockResolvedValueOnce(tx("completed"));
    await expect(pollTopUp(poll, opts)).resolves.toBe("completed");
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("resolves failed", async () => {
    await expect(pollTopUp(async () => tx("failed"), opts)).resolves.toBe(
      "failed",
    );
  });

  it("survives transient errors and times out while pending", async () => {
    const poll = jest
      .fn()
      .mockRejectedValueOnce(new Error("net"))
      .mockResolvedValue(tx("pending"));
    await expect(pollTopUp(poll, opts)).resolves.toBe("timeout");
    expect(poll).toHaveBeenCalledTimes(3);
  });
});

describe("phone helpers", () => {
  it("validates and normalizes", () => {
    expect(isValidPhone("+256 770-000000")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
    expect(normalizePhone("+256 770-000000")).toBe("256770000000");
  });
});
