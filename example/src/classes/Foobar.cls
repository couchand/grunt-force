public class Foobar
{
	private String message;

	public Foobar()
	{
		this('foobar');
	}

	public Foobar( String message )
	{
		this.message = message;
	}

	public String getValue()
	{
		System.debug( 'foobar - ' + message );
		return message;
	}

	public void setValue( String message )
	{
		System.debug( 'foobar - ' + message );
		this.message = message;
	}

    public void thisone()
    {
        thatone();
    }

    public void thatone()
    {
        theother();
    }

    public void theother()
    {
//        throw new BadThingException('something happened');
    }

    public class BadThingException extends Exception {}
}
