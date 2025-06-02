type TestCase = {
  name: string;
  description: string;
  body: Record<string, any>;
  expectedStatus: number;
};

export class TestCaseGenerator {
  static generateTestCases(requestBody: Record<string, any>): TestCase[] {
    const testCases: TestCase[] = [];

    const handleField = (
      obj: any,
      parent: string = "",
      rootObj = requestBody
    ) => {
      Object.entries(obj).forEach(([key, value]) => {
        const path = parent ? `${parent}.${key}` : key;
        const valueType = Array.isArray(value)
          ? "array"
          : value === null
          ? "null"
          : typeof value;

        if (["string", "number", "boolean"].includes(valueType)) {
          if (valueType === "boolean") {
            testCases.push(
              this.createTestCase({
                name: `${path} - Empty Value`,
                description: `Testing ${path} with empty value`,
                body: this.setDeepValue(rootObj, path, ""),
                expectedStatus: 400,
              }),
              this.createTestCase({
                name: `${path} - Null Value`,
                description: `Testing ${path} with null`,
                body: this.setDeepValue(rootObj, path, null),
                expectedStatus: 400,
              })
            );

            const invalidBooleans: [string, any][] = [
              ["Number 0", 0],
              ["Number 1", 1],
              ["Number 2", 2],
              ["String 'true'", "true"],
              ["String 'false'", "false"],
              ["String 'yes'", "yes"],
              ["String 'no'", "no"],
              ["Empty Array", []],
              ["Empty Object", {}],
            ];

            this.generateInvalidValueTestCases(
              testCases,
              path,
              rootObj,
              invalidBooleans,
              "Invalid Boolean"
            );
          } else {
            testCases.push(
              this.createTestCase({
                name: `${path} - Empty Value`,
                description: `Testing ${path} with empty value`,
                body: this.setDeepValue(rootObj, path, ""),
                expectedStatus: 400,
              }),
              this.createTestCase({
                name: `${path} - Null Value`,
                description: `Testing ${path} with null`,
                body: this.setDeepValue(rootObj, path, null),
                expectedStatus: 400,
              })
            );
          }
        }

        if (valueType === "array") {
          testCases.push(
            this.createTestCase({
              name: `${path} - Empty Array`,
              description: `Testing ${path} with empty array`,
              body: this.setDeepValue(rootObj, path, []),
              expectedStatus: 400,
            }),
            this.createTestCase({
              name: `${path} - Null Array`,
              description: `Testing ${path} with null`,
              body: this.setDeepValue(rootObj, path, null),
              expectedStatus: 400,
            }),

            // New test cases for arrays:
            this.createTestCase({
              name: `${path} - Array with Undefined Element`,
              description: `Testing ${path} with an array containing undefined`,
              body: this.setDeepValue(rootObj, path, [undefined]),
              expectedStatus: 400,
            }),

            this.createTestCase({
              name: `${path} - Array with Invalid Element Type`,
              description: `Testing ${path} with array containing invalid element types`,
              body: this.setDeepValue(rootObj, path, ["string", 123, true]),
              expectedStatus: 400,
            }),

            this.createTestCase({
              name: `${path} - Array with Duplicate Elements`,
              description: `Testing ${path} with array containing duplicates`,
              body: this.setDeepValue(
                rootObj,
                path,
                Array.isArray(value) && value.length > 0
                  ? [value[0], value[0]]
                  : []
              ),
              expectedStatus: 400,
            }),

            this.createTestCase({
              name: `${path} - Array Exceeding Max Length`,
              description: `Testing ${path} with array exceeding max length (100)`,
              body: this.setDeepValue(
                rootObj,
                path,
                new Array(101).fill(
                  Array.isArray(value) && value.length > 0 ? value[0] : null
                )
              ),
              expectedStatus: 400,
            }),

            this.createTestCase({
              name: `${path} - Array with Mixed Valid and Invalid Elements`,
              description: `Testing ${path} with array containing mixed valid and invalid elements`,
              body: this.setDeepValue(
                rootObj,
                path,
                Array.isArray(value) && value.length > 0
                  ? [value[0], null, "", 123]
                  : [null, "", 123]
              ),
              expectedStatus: 400,
            })
          );

          if (
            Array.isArray(value) &&
            value.length > 0 &&
            typeof value[0] === "object"
          ) {
            value.forEach((item, idx) =>
              handleField(item, `${path}[${idx}]`, rootObj)
            );
          }
        }
        if (valueType === "object" && value !== null && !Array.isArray(value)) {
          testCases.push(
            this.createTestCase({
              name: `${path} - Empty Object`,
              description: `Testing ${path} with empty object`,
              body: this.setDeepValue(rootObj, path, {}),
              expectedStatus: 400,
            }),
            this.createTestCase({
              name: `${path} - Null Object`,
              description: `Testing ${path} with null`,
              body: this.setDeepValue(rootObj, path, null),
              expectedStatus: 400,
            }),

            // New test cases for objects:
            this.createTestCase({
              name: `${path} - Object with Missing Required Fields`,
              description: `Testing ${path} with object missing required fields`,
              body: this.setDeepValue(rootObj, path, {}), // Same as empty but semantically for missing required fields
              expectedStatus: 400,
            }),

            this.createTestCase({
              name: `${path} - Object with Additional Unknown Fields`,
              description: `Testing ${path} with object containing unknown fields`,
              body: this.setDeepValue(rootObj, path, {
                ...value,
                unknownField: "unexpected",
              }),
              expectedStatus: 400,
            }),

            this.createTestCase({
              name: `${path} - Object with Null Fields`,
              description: `Testing ${path} with object having some fields set to null`,
              body: this.setDeepValue(
                rootObj,
                path,
                Object.fromEntries(
                  Object.entries(value ?? {}).map(([k]) => [k, null])
                )
              ),
              expectedStatus: 400,
            }),

            this.createTestCase({
              name: `${path} - Object with Empty String Fields`,
              description: `Testing ${path} with object having some fields set to empty strings`,
              body: this.setDeepValue(
                rootObj,
                path,
                Object.fromEntries(
                  Object.entries(value ?? {}).map(([k]) => [k, ""])
                )
              ),
              expectedStatus: 400,
            }),

            this.createTestCase({
              name: `${path} - Object with Incorrect Field Types`,
              description: `Testing ${path} with object having incorrect field types`,
              body: this.setDeepValue(
                rootObj,
                path,
                Object.fromEntries(
                  Object.entries(value ?? {}).map(([k, v]) => [
                    k,
                    typeof v === "string" ? 123 : "invalid",
                  ])
                )
              ),
              expectedStatus: 400,
            })
          );

          // Recursively test nested fields
          handleField(value, path, rootObj);
        }

        // === Email validation ===
        if (key.toLowerCase().includes("mail")) {
          const emailInvalids: [string, any][] = [
            ["No At Symbol", "invalidemail"],
            ["No Domain", "invalid@"],
            ["Special Chars", "test!@example.com"],
            ["Double At", "test@@example.com"],
            [
              "Long Local Part",
              "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@example.com",
            ],
            ["Empty", ""],
            ["Null", null],

            ["Space in Email", "test @example.com"],
            ["No Username (Local Part)", "@example.com"],
            ["Missing TLD", "test@example"],
            ["Dot Starts Domain", "test@.com"],
            ["Double Dot in Domain", "test@example..com"],
            ["Unicode Characters", "tést@example.com"],
            ["Backslash in Email", "test\\@example.com"],
            ["Email Starts with Dot", ".test@example.com"],
            ["Email Ends with Dot", "test.@example.com"],
            ["Trailing Space", "test@example.com "],
            ["Leading Space", " test@example.com"],
            ["Multiple Dots in Local Part", "first..last@example.com"],
            ["Quoted Local Part (invalid here)", '"test"@example.com'],
            ["Local Part is Dot", ".@example.com"],
            ["Only @ and Domain", "@example.com"],
            ["Numeric Domain Only", "user@123"],
            ["Numeric Domain with TLD Missing", "user@345"],
            ["Numeric Domain with Dot", "user@123.456"],
            ["Domain is Just Numbers", "user@9999999999"],
            ["Domain Starts With Number", "user@1example.com"],
            ["Domain Ends With Number", "user@example1.com"],
            ["Domain Only Numbers with TLD", "user@123.com"],
            ["IP Address as Domain (Invalid)", "user@192.168.1.1"],
            ["IP Address in Brackets (Valid)", "user@[192.168.1.1]"],
            ["Domain Label with Underscore", "user@exa_mple.com"],
          ];
          this.generateInvalidValueTestCases(
            testCases,
            path,
            rootObj,
            emailInvalids,
            "Invalid Email"
          );
        }

        // === UUID validation ===
        if (
          valueType === "string" &&
          typeof value === "string" &&
          this.isUuid(value)
        ) {
          const uuidInvalids: [string, any][] = [
            ["Empty String", ""],
            ["Too Short", "123"],
            ["Bad Format", "bad-uuid"],
            ["Number Instead", 123],
            ["Empty Array", []],
            ["Empty Object", {}],
            ["Null", null],
          ];

          this.generateInvalidValueTestCases(
            testCases,
            path,
            rootObj,
            uuidInvalids,
            "Invalid UUID"
          );
        }

        // === Date validation ===
        if (valueType === "string" && this.isDate(value as string, key)) {
          const dateInvalids: [string, any][] = [
            ["Empty String", ""], // Empty string instead of a date
            ["Not a Date", "not-a-date"], // Random string that isn’t a date
            ["Invalid Format", "32/13/2024"], // Invalid date format (day/month wrong)
            ["Wrong Format", "2024-13-01"], // Invalid month in ISO format
            ["Number Instead", 12345], // Number instead of string
            ["Empty Array", []], // Wrong data type: array
            ["Empty Object", {}], // Wrong data type: object
            ["Null", null], // Null value
            ["Boolean True", true], // Boolean instead of string
            ["Boolean False", false], // Boolean instead of string
            ["Whitespace String", "   "], // Only whitespace
            ["Invalid ISO Date", "2024-02-30T00:00:00Z"], // Non-existent date but valid ISO format
          ];

          this.generateInvalidValueTestCases(
            testCases,
            path,
            rootObj,
            dateInvalids,
            "Invalid Date"
          );
        }
      });
    };

    handleField(requestBody);
    return testCases;
  }

  private static generateInvalidValueTestCases(
    testCases: TestCase[],
    path: string,
    rootObj: Record<string, any>,
    invalidValues: [string, any][],
    testCasePrefix: string
  ) {
    invalidValues.forEach(([label, val]) => {
      testCases.push(
        this.createTestCase({
          name: `${path} - ${testCasePrefix} (${label})`,
          description: `Testing ${path} with ${testCasePrefix.toLowerCase()}: ${val}`,
          body: this.setDeepValue(rootObj, path, val),
          expectedStatus: 400,
        })
      );
    });
  }

  private static createTestCase({
    name,
    description,
    body,
    expectedStatus,
  }: {
    name: string;
    description: string;
    body: Record<string, any>;
    expectedStatus: number;
  }): TestCase {
    return {
      name,
      description,
      body,
      expectedStatus,
    };
  }

  // Helper: Set a deep value on a cloned object given a dotted path
  private static setDeepValue(
    obj: Record<string, any>,
    path: string,
    value: any
  ): Record<string, any> {
    const clone = JSON.parse(JSON.stringify(obj)); // Deep clone to avoid mutation
    const keys = path.split(/\.|\[(\d+)\]/).filter(Boolean);

    let current = clone;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = isNaN(Number(keys[i])) ? keys[i] : Number(keys[i]);
      if (!(key in current)) {
        // Create if missing
        current[key] = {};
      }
      current = current[key];
    }

    const lastKey = isNaN(Number(keys[keys.length - 1]))
      ? keys[keys.length - 1]
      : Number(keys[keys.length - 1]);

    current[lastKey] = value;
    return clone;
  }

  // Helper: UUID format check (simple regex)
  private static isUuid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  // Helper: Date format check (you can customize based on your expected formats)
  private static isDate(value: string, key: string): boolean {
    // Simple ISO 8601 check (YYYY-MM-DD or with time)
    const isoDateRegex =
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

    // You can add additional keys or formats here as needed
    if (key.toLowerCase().includes("date")) {
      return isoDateRegex.test(value);
    }
    return false;
  }
}
