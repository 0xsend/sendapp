import { Button, ButtonProps, Paragraph } from "@my/ui"

export const SendItButton = (props: ButtonProps) => {
  return (
    <Button
      borderRadius={'$9'}
      height={'$6'}
      style={{
        backgroundImage: "linear-gradient(180deg, #FFF8EE -6.25%, #DAC5A5 26.35%, #AB8F76 49.48%, #8F775D 63.79%, #A68B6E 77.97%, #B79A7A 100%)",
        boxShadow: "0px 2px 2px 0px rgba(0, 0, 0, 0.20)"
      }}
      {...props}
    >
      <Paragraph
        size={'$6'}
        color={'$color4'}
        fontWeight={'700'}
      >
        Send it!
      </Paragraph>
    </Button>
  )
}
