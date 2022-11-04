import { x } from "@xstyled/styled-components";

const InnerCode = (props) => (
  <x.div p={2} backgroundColor="code-bg" borderRadius="md" {...props} />
);

export const InlineCode = (props) => (
  <x.pre
    backgroundColor="code-bg"
    color="primary-text"
    borderRadius="base"
    fontWeight="normal"
    fontSize="xs"
    lineHeight={1}
    p={1}
    w="fit-content"
    display="inline-block"
    whiteSpace="pre-wrap"
    {...props}
  />
);

export function Code({ children, ...props }) {
  return (
    <InnerCode {...props}>
      <x.pre overflowX="auto">{children}</x.pre>
    </InnerCode>
  );
}
